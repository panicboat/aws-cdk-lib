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
  private nextAddress!: string;

  public createResources(props: Props): void {
    this.nextAddress = props.cidrBlock.split('/')[0];
    this.protected = this.createSubnets(this.scope, props, this.nextAddress, this.getSubnetMask()[1], 'ProtectedSubnet');
    this.public = this.createSubnets(this.scope, props, this.nextAddress, this.getSubnetMask()[0], 'PublicSubnet');
    this.private = this.createSubnets(this.scope, props, this.nextAddress, this.getSubnetMask()[2], 'PrivateSubnet');
  }

  private createSubnets(scope: cdk.Construct, props: Props, firstAddress: string, subnetmask: string, subnetType: string): string[] {
    let availabilityZones = cdk.Fn.getAzs();
    let azName: string[] = this.getAvailabilityZoneNames();
    let resources: string[] = [];
    for (let i = 0; i < azName.length; i++) {
      let id: string = `${subnetType}${azName[i]}`;
      let subnet = this.ip.subnet(firstAddress, subnetmask);

      let resource = new CfnSubnet(scope, id, {
        cidrBlock: subnet.networkAddress + '/' + subnet.subnetMaskLength.toString(),
        vpcId: props.vpcId,
        availabilityZone: cdk.Fn.select(i, availabilityZones),
        tags: [{ key: 'Name', value: id }],
      });
      new cdk.CfnOutput(scope, `Export${id}`, {
        value: resource.ref,
        exportName: `${props.projectName}:${id}`,
      });

      resources.push(resource.ref);
      firstAddress = this.ip.fromLong(this.ip.toLong(subnet.broadcastAddress) + 1);
      this.nextAddress = firstAddress;
    }
    new cdk.CfnOutput(scope, `Export${subnetType}`, {
      value: resources.toString(),
      exportName: `${props.projectName}:${subnetType}`,
    });
    return resources;
  }
}
