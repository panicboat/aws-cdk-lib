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
    this.createEC2RoleforSSM(this.scope, props);
    this.createChatbotRole(this.scope, props);
  }

  private createEC2RoleforSSM(scope: cdk.Construct, props: Props): void {
    const role = new CfnRole(scope, 'EC2RoleforSSM', {
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
      roleName: `${props.projectName}EC2RoleforSSM`
    });
    new CfnInstanceProfile(scope, 'InstanceProfile', {
      instanceProfileName: `${props.projectName}EC2ProfileforSSM`,
      roles: [role.ref]
    });
    new cdk.CfnOutput(scope, `ExportEC2RoleforSSM`, {
      value: cdk.Fn.getAtt(role.logicalId, 'Arn').toString(),
      exportName: `${props.projectName}:EC2RoleforSSM`,
    });
  }

  private createChatbotRole(scope: cdk.Construct, props: Props): void {
    const role = new CfnRole(scope, 'ChatbotRole', {
      assumeRolePolicyDocument: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            principals: [ new ServicePrincipal('chatbot.amazonaws.com') ],
            actions: ['sts:AssumeRole']
          })
        ]
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess',
      ],
      roleName: `${props.projectName}ChatbotRole`
    });
    new cdk.CfnOutput(scope, `ExportChatbotRole`, {
      value: cdk.Fn.getAtt(role.logicalId, 'Arn').toString(),
      exportName: `${props.projectName}:ChatbotRole`,
    });
  }
}
