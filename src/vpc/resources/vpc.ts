import * as cdk from '@aws-cdk/core';
import { CfnVPC } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  cidrBlock: string;
}
interface IVpc {
  readonly vpcId: string;
  createResources(props: Props): void;
}
export class Vpc extends Resource implements IVpc {
  public vpcId!: string;
  public createResources(props: Props): void {
    const vpc = new CfnVPC(this.scope, 'Vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: [{ key: 'Name', value: 'main' }],
    });
    new cdk.CfnOutput(this.scope, `ExportVpcId`, {
      value: vpc.ref,
      exportName: `${props.projectName}:VpcId`,
    });
    this.vpcId = vpc.ref;
  }
}
