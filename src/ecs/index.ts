import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { Repository } from './resources/repository';
import { Iam } from './resources/iam';
import { Logs } from './resources/logs';
import { TaskDefinition } from './resources/taskdefinition';
import { Service } from './resources/service';
import { INamespace } from '@aws-cdk/aws-servicediscovery';

interface Props {
  projectName: string;
  cpu: number;
  memoryLimitMiB: number;
  appPorts: number[];
  virtualNodeName: string;
  containers: ecs.ContainerDefinitionOptions[];
  cluster: ecs.ICluster;
  namespace: INamespace;
  desiredCount: number;
}
interface IEcsResources {
}
export class EcsResources extends cdk.Construct implements IEcsResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    const iam = new Iam(this);
    iam.createResources({ projectName: props.projectName });

    const logs = new Logs(this);
    logs.createResources({ projectName: props.projectName });

    const repository = new Repository(this);
    repository.createResources({ projectName: props.projectName });

    const taskdef = new TaskDefinition(this);
    taskdef.createResources({
      projectName: props.projectName, cpu: props.cpu, memoryLimitMiB: props.memoryLimitMiB, appPorts: props.appPorts, virtualNodeName: props.virtualNodeName,
      executionRole: iam.executionRole, taskRole: iam.taskRole, logGroup: logs.logGroup, containers: props.containers,
    });

    const service = new Service(this);
    service.createResources({ projectName: props.projectName, cluster: props.cluster, taskDefinition: taskdef.taskDefinition, namespace: props.namespace, desiredCount: props.desiredCount });
  }
}
