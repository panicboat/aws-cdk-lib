import * as cdk from '@aws-cdk/core';
import { CfnSubnet } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';


interface Props {
  projectName: string;
  vpcId: string;
  cidrBlock: string;
}
interface ISubnet {
  readonly public: string[];
  readonly protected: string[];
  readonly private: string[];
  createResources(props: Props): void;
}
export class Subnet extends Resource implements ISubnet {
  public public!: string[];
  public protected!: string[];
  public private!: string[];
  private ip = require('ip');

  public createResources(props: Props): void {
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
          tags: [{ key: 'Name', value: id }],
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

    this.public = resources['Public'];
    this.protected = resources['Protected'];
    this.private = resources['Private'];
  }

  private getSubnet(): { label: string, mask: string }[] {
    return [
      { label: 'Protected', mask: '255.255.224.000' },
      { label: 'Public',    mask: '255.255.240.000' },
      { label: 'Private',   mask: '255.255.240.000' },
    ]
  }
}
