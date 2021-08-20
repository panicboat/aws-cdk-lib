import * as cdk from '@aws-cdk/core';
import { CfnSecurityGroup, CfnSecurityGroupIngress } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpcId: string;
  cidrBlock: string;
}
interface ISecurityGroup {
  readonly main: string;
  createResources(props: Props): void;
}
export class SecurityGroup extends Resource implements ISecurityGroup {
  public main!: string;
  public createResources(props: Props): void {
    const sg = new CfnSecurityGroup(this.scope, 'SecurityGroup', {
      groupDescription: 'security group for organizations.',
      groupName: 'main',
      vpcId: props.vpcId,
    });
    new CfnSecurityGroupIngress(this.scope, 'SecurityGroupIngress', {
      ipProtocol: '-1',
      groupId: sg.ref,
      cidrIp: props.cidrBlock,
    });
    this.main = sg.ref;
  }
}
