import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { Resource } from '../resource';
import { TaskExecutionRoleProps, TaskRoleProps } from '../props';

interface IIam {
  createTaskExecutionRole(props: TaskExecutionRoleProps): iam.Role;
  createTaskRole(props: TaskRoleProps): iam.Role;
}
export class Iam extends Resource implements IIam {

  public createTaskExecutionRole(props: TaskExecutionRoleProps) {
    const executionRole = new iam.Role(this.scope, `EcsTaskExecutionRole-${props.projectName}`, {
      roleName: `EcsTaskExecutionRole-${props.projectName}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ].concat(props.managedPolicies),
    });
    props.inlinePolicies.forEach(inlinePolicy => {
      executionRole.attachInlinePolicy(inlinePolicy);
    });
    return executionRole;
  }

  public createTaskRole(props: TaskRoleProps) {
    const taskRole = new iam.Role(this.scope, `EcsTaskRole-${props.projectName}`, {
      roleName: `EcsTaskRole-${props.projectName}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceEventsRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSAppMeshEnvoyAccess'),
      ].concat(props.managedPolicies),
    });
    props.inlinePolicies.forEach(inlinePolicy => {
      taskRole.attachInlinePolicy(inlinePolicy);
    });
    return taskRole;
  }
}
