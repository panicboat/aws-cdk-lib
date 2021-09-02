import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { Resource } from '../resource';

interface Props {
  projectName: string;
}
interface IIam {
  readonly executionRole: iam.IRole;
  readonly taskRole: iam.IRole;
  createResources(props: Props): void;
}
export class Iam extends Resource implements IIam {
  public executionRole!: iam.IRole;
  public taskRole!: iam.IRole;
  public createResources(props: Props): void {
    this.createTaskExecutionRole(this.scope, props);
    this.createTaskRole(this.scope, props);
  }

  private createTaskExecutionRole(scope: cdk.Construct, props: Props): void {
    this.executionRole = new iam.Role(scope, `EcsTaskExecutionRole-${props.projectName}`, {
      roleName: `EcsTaskExecutionRole-${props.projectName}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
        // iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
        // iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });
  }

  private createTaskRole(scope: cdk.Construct, props: Props): void {
    this.taskRole = new iam.Role(scope, `EcsTaskRole-${props.projectName}`, {
      roleName: `EcsTaskRole-${props.projectName}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        new iam.ServicePrincipal('events.amazonaws.com'),
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceEventsRole'),
        // iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess'),
      ]
    });
  }
}
