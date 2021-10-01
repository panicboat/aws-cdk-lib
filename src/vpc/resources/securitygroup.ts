import { CfnSecurityGroup, CfnSecurityGroupIngress } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpcId: string;
  cidrBlock: string;
}
interface ISecurityGroup {
  readonly main: string;
  readonly cidrblock: string;
  createResources(props: Props): void;
}
export class SecurityGroup extends Resource implements ISecurityGroup {
  public main!: string;
  public cidrblock!: string;
  public createResources(props: Props): void {
    this.main = this.createMain(props);
    this.cidrblock = this.createForEndpoints(props);
  }

  private createMain(props: Props): string {
    const sg = new CfnSecurityGroup(this.scope, 'SecurityGroup', {
      groupDescription: 'security group for organizations.',
      groupName: 'main',
      vpcId: props.vpcId,
    });
    new CfnSecurityGroupIngress(this.scope, 'SecurityGroupIngress', {
      ipProtocol: '-1',
      groupId: sg.ref,
      sourceSecurityGroupId: sg.ref,
    });
    return sg.ref
  }

  private createForEndpoints(props: Props): string {
    const sg = new CfnSecurityGroup(this.scope, 'VpcSecurityGroup', {
      groupDescription: 'security group for vpc cidr.',
      groupName: 'cidrblock',
      vpcId: props.vpcId,
    });
    new CfnSecurityGroupIngress(this.scope, 'VpcSecurityGroupIngress', {
      ipProtocol: '-1',
      groupId: sg.ref,
      cidrIp: props.cidrBlock,
    });
    return sg.ref
  }
}
