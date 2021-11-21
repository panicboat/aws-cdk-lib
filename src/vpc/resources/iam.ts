import * as cdk from '@aws-cdk/core';
import { CfnInstanceProfile, CfnRole, Effect, PolicyDocument, PolicyStatement, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Resource } from '../resource';

interface IIam {
  createSSMManagedInstanceRole(props: { projectName: string }): CfnRole;
}
export class Iam extends Resource implements IIam {

  public createSSMManagedInstanceRole(props: { projectName: string }) {
    const role = new CfnRole(this.scope, 'Role', {
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
    new CfnInstanceProfile(this.scope, 'InstanceProfile', {
      instanceProfileName: 'AmazonSSMManagedInstanceProfile',
      roles: [role.ref]
    });
    return role;
  }
}
