import * as cdk from '@aws-cdk/core';
import { CfnInstanceProfile, CfnRole, Effect, PolicyDocument, PolicyStatement, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Resource } from '../resource';

interface Props {
  projectName: string;
}
interface IIam {
  createResources(props: Props): void;
}
export class Iam extends Resource implements IIam {
  public createResources(props: Props): void {
    this.createSSMManagedInstanceRole(this.scope, props);
  }

  private createSSMManagedInstanceRole(scope: cdk.Construct, props: Props): void {
    const role = new CfnRole(scope, 'Role', {
      assumeRolePolicyDocument: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [ new ServicePrincipal('ec2.amazonaws.com') ],
            actions: ['sts:AssumeRole']
          })
        ]
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      ],
      roleName: 'AmazonSSMManagedInstanceRole'
    });
    new CfnInstanceProfile(scope, 'InstanceProfile', {
      instanceProfileName: 'AmazonSSMManagedInstanceProfile',
      roles: [role.ref]
    });
  }
}
