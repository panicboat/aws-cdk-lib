import { CfnSecurityGroup, CfnSecurityGroupIngress } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface ISecurityGroup {
  createMain(props: { vpcId: string, cidrBlock: string }): string
}
export class SecurityGroup extends Resource implements ISecurityGroup {

  public createMain(props: { vpcId: string, cidrBlock: string }) {
    const sg = new CfnSecurityGroup(this.scope, 'SecurityGroup', {
      groupDescription: 'security group for organizations.',
      groupName: 'main',
      vpcId: props.vpcId,
    });
    new CfnSecurityGroupIngress(this.scope, 'SecurityGroupIngress', {
      ipProtocol: '-1',
      groupId: sg.ref,
      cidrIp: props.cidrBlock
    });
    return sg.ref
  }
}
