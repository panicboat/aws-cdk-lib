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
      for (let j = 0; j < this.getSubnetType().length; j++) {
        let id: string = `${this.getSubnetType()[j]}${this.getAvailabilityZoneNames()[i]}`;
        let subnet = this.ip.subnet(firstAddress, this.getSubnetMask()[j]);
        const resource = new CfnSubnet(this.scope, id, {
          cidrBlock: subnet.networkAddress + '/' + subnet.subnetMaskLength.toString(),
          vpcId: props.vpcId,
          availabilityZone: cdk.Fn.select(i, cdk.Fn.getAzs()),
          tags: [{ key: 'Name', value: id }],
        });
        if (resources[this.getSubnetType()[j]] === undefined) {
          resources[this.getSubnetType()[j]] = [];
        }
        resources[this.getSubnetType()[j]].push(resource.ref);
        firstAddress = this.ip.fromLong(this.ip.toLong(subnet.broadcastAddress) + 1);
      }
    }
    this.getSubnetType().forEach(subnetType => {
      new cdk.CfnOutput(this.scope, `Export${subnetType}`, {
        value: resources[subnetType].toString(),
        exportName: `${props.projectName}:${subnetType}`,
      });
    });

    this.public = resources['Public'];
    this.protected = resources['Protected'];
    this.private = resources['Private'];
  }

  private getSubnetType(): string[] {
    return ['Protected', 'Public', 'Private'];
  }

  private getSubnetMask(): string[] {
    return ['255.255.224.000', '255.255.240.000', '255.255.240.000'];
  }
}
