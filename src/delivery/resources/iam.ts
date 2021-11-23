import * as iam from '@aws-cdk/aws-iam';
import { BuildRoleProps, PipelineRoleProps } from '../props';
import { Resource } from '../resource';

interface IIam {
  createPipelineRole(props: PipelineRoleProps): iam.Role;
  createBuildRole(props: BuildRoleProps): iam.Role;
}
export class Iam extends Resource implements IIam {

  public createPipelineRole(props: PipelineRoleProps) {
    const pipelineRole = new iam.Role(this.scope, `PipelineRole-${props.projectName}`, {
      roleName: `PipelineRole-${props.projectName}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'),
      ].concat(props.managedPolicies),
    });
    props.inlinePolicies.forEach(inlinePolicy => {
      pipelineRole.attachInlinePolicy(inlinePolicy);
    });
    return pipelineRole;
  }

  public createBuildRole(props: BuildRoleProps) {
    const buildRole = new iam.Role(this.scope, `CodeBuildRole-${props.projectName}`, {
      roleName: `CodeBuildRole-${props.projectName}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ].concat(props.managedPolicies),
    });
    props.inlinePolicies.forEach(inlinePolicy => {
      buildRole.attachInlinePolicy(inlinePolicy);
    });
    const policy = new iam.Policy(this.scope, `CodeBuildRole-DefaultPoliciy-${props.projectName}`, {
      policyName: `default-build-policy`,
      statements: [
        new iam.PolicyStatement({ effect: iam.Effect.ALLOW, actions: ['ecr:GetAuthorizationToken', 'ssm:GetParameters', 'secretsmanager:GetSecretValue'], resources: ['*'] }),
        new iam.PolicyStatement({ effect: iam.Effect.ALLOW, actions: ['ec2:CreateNetworkInterface', 'ec2:DeleteNetworkInterface', 'ec2:Describe*'], resources: ['*'] }),
        new iam.PolicyStatement({ effect: iam.Effect.ALLOW, actions: ['*'], resources: [`arn:aws:ec2:${this.stack.region}:${this.stack.account}:network-interface/*`] }),
      ]
    });
    buildRole.attachInlinePolicy(policy);
    return buildRole;
  }
}
