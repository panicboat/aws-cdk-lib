import * as cdk from '@aws-cdk/core';
import { AccountPrincipal, CfnInstanceProfile, CfnPolicy, CfnRole, Effect, PolicyDocument, PolicyStatement, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  principal: {
    primary: {
      accountId: string;
    }
  };
}
interface IIam {
  createResources(props: Props): void;
}
export class Iam extends Resource implements IIam {
  public createResources(props: Props): void {
    this.createSSMManagedInstanceRole(this.scope, props);
    if (props.principal.primary.accountId.length === 0) {
      // For primary account
      this.createStackSetAdministrationRole(this.scope, props);
    }
    if (props.principal.primary.accountId.length !== 0) {
      // For secondary account
      this.createStackSetExecutionRole(this.scope, props);
    }
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

  private createStackSetAdministrationRole(scope: cdk.Construct, props: Props): void {
    const role = new CfnRole(scope, 'StackSetAdministrationRole', {
      assumeRolePolicyDocument: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [ new ServicePrincipal('cloudformation.amazonaws.com') ],
            actions: ['sts:AssumeRole']
          })
        ]
      }),
      roleName: 'AWSCloudFormationStackSetAdministrationRole'
    });
    new CfnPolicy(scope, 'StackSetAdministrationRolePolicy', {
      policyName: 'AssumeExecutionRole',
      policyDocument: new PolicyDocument({
        statements: [new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['sts:AssumeRole'],
          resources: ['arn:aws:iam::*:role/AWSCloudFormationStackSetExecutionRole'],
        })],
      }),
      roles: [role.ref],
    });
  }

  private createStackSetExecutionRole(scope: cdk.Construct, props: Props): void {
    const role = new CfnRole(scope, 'StackSetExecutionRole', {
      assumeRolePolicyDocument: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [ new AccountPrincipal(props.principal.primary.accountId) ],
            actions: ['sts:AssumeRole']
          })
        ]
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/AdministratorAccess',
      ],
      roleName: 'AWSCloudFormationStackSetExecutionRole'
    });
  }
}
