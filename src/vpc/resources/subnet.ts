import * as cdk from '@aws-cdk/core';
import { CfnSubnet, SubnetType } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpcId: string;
  cidrBlock: string;
}
interface ISubnet {
  createSubnets(props: Props): {
    public: string[]
    private: string[]
    isolated: string[]
  }
}
export class Subnet extends Resource implements ISubnet {
  private ip = require('ip');

  public createSubnets(props: Props) {
    let resources: { [key: string]: string[]; } = {};
    let firstAddress = props.cidrBlock.split('/')[0];
    for (let i = 0; i < this.getAvailabilityZoneNames().length; i++) {
      this.getSubnet().forEach((subnetInfo: { label: string, mask: string }) => {
        let id: string = `${subnetInfo.label}${this.getAvailabilityZoneNames()[i]}`;
        let subnet = this.ip.subnet(firstAddress, subnetInfo.mask);
        const resource = new CfnSubnet(this.scope, id, {
          cidrBlock: subnet.networkAddress + '/' + subnet.subnetMaskLength.toString(),
          vpcId: props.vpcId,
          availabilityZone: cdk.Fn.select(i, cdk.Fn.getAzs()),
          tags: [
            { key: 'Name', value: id },
            { key: 'aws-cdk:subnet-type', value: subnetInfo.label }
          ],
        });
        if (resources[subnetInfo.label] === undefined) {
          resources[subnetInfo.label] = [];
        }
        resources[subnetInfo.label].push(resource.ref);
        firstAddress = this.ip.fromLong(this.ip.toLong(subnet.broadcastAddress) + 1);
      });
    }
    this.getSubnet().forEach((subnetInfo: { label: string, mask: string }) => {
      new cdk.CfnOutput(this.scope, `Export${subnetInfo.label}`, {
        value: resources[subnetInfo.label].toString(),
        exportName: `${props.projectName}:${subnetInfo.label}`,
      });
    });
    return {
      public: resources[SubnetType.PUBLIC],
      private: resources[SubnetType.PRIVATE_WITH_NAT],
      isolated: resources[SubnetType.PRIVATE_ISOLATED],
    }
  }

  private getSubnet(): { label: string, mask: string }[] {
    return [
      { label: SubnetType.PRIVATE_WITH_NAT, mask: '255.255.224.000' },
      { label: SubnetType.PUBLIC,           mask: '255.255.240.000' },
      { label: SubnetType.PRIVATE_ISOLATED, mask: '255.255.240.000' },
    ]
  }
}
