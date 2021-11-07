import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { ILogGroup } from '@aws-cdk/aws-logs';
import { IRole } from '@aws-cdk/aws-iam';
import { Resource } from '../resource';


interface Props {
  projectName: string;
  cpu: number;
  memoryLimitMiB: number;
  appPorts: number[];
  taskRole: IRole;
  executionRole: IRole;
  logGroup: ILogGroup;
  containers: ecs.ContainerDefinitionOptions[];
}
interface ITaskDefinition {
  readonly taskDefinition: ecs.FargateTaskDefinition;
  createResources(props: Props): void;
}
export class TaskDefinition extends Resource implements ITaskDefinition {
  public taskDefinition!: ecs.FargateTaskDefinition;
  public createResources(props: Props): void {
    this.taskDefinition = new ecs.FargateTaskDefinition(this.scope, `TaskDefinition-${props.projectName}`, {
      family: props.projectName,
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      taskRole: props.taskRole,
      executionRole: props.executionRole,
    });
    props.containers.forEach(container => {
      // https://github.com/aws/aws-cdk/issues/10113#issuecomment-861798827
      this.taskDefinition.addContainer(container.containerName!, container);
    });
    this.taskDefinition.addFirelensLogRouter('fluent-bit', {
      firelensConfig: {
        type: ecs.FirelensLogRouterType.FLUENTBIT,
      },
      image: ecs.ContainerImage.fromRegistry('amazon/aws-for-fluent-bit:latest')
    });
  }
}
