import * as iam from '@aws-cdk/aws-iam';
import { Resource } from '../resource';

interface Props {
  projectName: string
  pipelineRole: {
    managedPolicies: iam.IManagedPolicy[]
    inlinePolicies: iam.Policy[]
  }
  buildRole: {
    managedPolicies: iam.IManagedPolicy[]
    inlinePolicies: iam.Policy[]
  }
}
interface IIam {
  readonly pipelineRole: iam.IRole;
  readonly buildRole: iam.IRole;
  createResources(props: Props): void;
}
export class Iam extends Resource implements IIam {
  public pipelineRole!: iam.IRole;
  public buildRole!: iam.IRole;
  public createResources(props: Props): void {
    this.createPipelineRole(props);
    this.createBuildRole(props);
  }

  private createPipelineRole(props: Props): void {
    this.pipelineRole = new iam.Role(this.scope, `PipelineRole-${props.projectName}`, {
      roleName: `PipelineRole-${props.projectName}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'),
      ].concat(props.pipelineRole.managedPolicies),
    });
    props.pipelineRole.inlinePolicies.forEach(inlinePolicy => {
      this.pipelineRole.attachInlinePolicy(inlinePolicy);
    });
  }

  private createBuildRole(props: Props): void {
    this.buildRole = new iam.Role(this.scope, `CodeBuildRole-${props.projectName}`, {
      roleName: `CodeBuildRole-${props.projectName}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ].concat(props.buildRole.managedPolicies),
    });
    props.buildRole.inlinePolicies.forEach(inlinePolicy => {
      this.buildRole.attachInlinePolicy(inlinePolicy);
    });
    const policy = new iam.Policy(this.scope, `CodeBuildRole-DefaultPoliciy-${props.projectName}`, {
      policyName: `default-build-policy`,
      statements: [
        new iam.PolicyStatement({ effect: iam.Effect.ALLOW, actions: ['ecr:GetAuthorizationToken', 'ssm:GetParameters', 'secretsmanager:GetSecretValue'], resources: ['*'] }),
        new iam.PolicyStatement({ effect: iam.Effect.ALLOW, actions: ['sts:AssumeRole'], resources: ['*'] }),
        new iam.PolicyStatement({ effect: iam.Effect.ALLOW, actions: ['ec2:CreateNetworkInterface', 'ec2:DeleteNetworkInterface', 'ec2:Describe*'], resources: ['*'] }),
        new iam.PolicyStatement({ effect: iam.Effect.ALLOW, actions: ['*'], resources: [`arn:aws:ec2:${this.stack.region}:${this.stack.account}:network-interface/*`] }),
      ]
    });
    this.buildRole.attachInlinePolicy(policy);
  }
}
