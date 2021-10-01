import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
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
    if (props.principal.primary.accountId.length === 0) {
      // For primary account
      this.createStackSetAdministrationRole(this.scope, props);
    }
    if (props.principal.primary.accountId.length !== 0) {
      // For secondary account
      this.createStackSetExecutionRole(this.scope, props);
    }
  }

  private createStackSetAdministrationRole(scope: cdk.Construct, props: Props): void {
    const role = new iam.Role(scope, `StackSetAdministrationRole-${props.projectName}`, {
      roleName: 'AWSCloudFormationStackSetAdministrationRole',
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
    });
    role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      resources: ['arn:aws:iam::*:role/AWSCloudFormationStackSetExecutionRole'],
    }));
  }

  private createStackSetExecutionRole(scope: cdk.Construct, props: Props): void {
    const role = new iam.Role(scope, `StackSetExecutionRole-${props.projectName}`, {
      roleName: 'AWSCloudFormationStackSetExecutionRole',
      assumedBy: new iam.AccountPrincipal(props.principal.primary.accountId),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ]
    });
  }
}
