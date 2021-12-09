import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { Resource } from '../resource';
import { TaskDefinitionProps } from '../props';

interface ITaskDefinition {
  createTaskDefinition(props: TaskDefinitionProps): ecs.FargateTaskDefinition;
}
export class TaskDefinition extends Resource implements ITaskDefinition {

  public createTaskDefinition(props: TaskDefinitionProps) {
    const taskDefinition = new ecs.FargateTaskDefinition(this.scope, `TaskDefinition-${props.projectName}`, {
      family: props.projectName,
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      taskRole: props.taskRole,
      executionRole: props.executionRole,
    });
    props.containers.forEach(container => {
      // https://github.com/aws/aws-cdk/issues/10113#issuecomment-861798827
      taskDefinition.addContainer(container.containerName!, container);
    });
    taskDefinition.addFirelensLogRouter('fluent-bit', {
      firelensConfig: {
        type: ecs.FirelensLogRouterType.FLUENTBIT,
      },
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-for-fluent-bit:latest')
    });
    return taskDefinition;
  }
}
