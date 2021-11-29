import { CfnSecurityGroup, CfnSecurityGroupIngress } from '@aws-cdk/aws-ec2';
import { SecurityGroupProps } from '../props';
import { Resource } from '../resource';

interface ISecurityGroup {
  createMain(props: SecurityGroupProps): string
}
export class SecurityGroup extends Resource implements ISecurityGroup {

  public createMain(props: SecurityGroupProps) {
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
