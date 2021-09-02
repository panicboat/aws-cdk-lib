import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { ISecurityGroup, ISubnet } from '@aws-cdk/aws-ec2';
import { IManagedPolicy, Policy } from '@aws-cdk/aws-iam';
import { INamespace } from '@aws-cdk/aws-servicediscovery';
import { LogGroup } from '@aws-cdk/aws-logs';
import { Repository } from './resources/repository';
import { Iam } from './resources/iam';
import { TaskDefinition } from './resources/taskdefinition';
import { Service } from './resources/service';

interface Props {
  projectName: string;
  cpu: number;
  memoryLimitMiB: number;
  appPorts: number[];
  virtualNodeName: string;
  containers: ecs.ContainerDefinitionOptions[];
  logGroup: LogGroup;
  cluster: ecs.ICluster;
  namespace: INamespace;
  desiredCount: number;
  securityGroups: ISecurityGroup[];
  subnets: ISubnet[];
  ecsTaskExecutionRole: {
    managedPolicies: IManagedPolicy[];
    inlinePolicies: Policy[];
  };
  ecsTaskRole: {
    managedPolicies: IManagedPolicy[];
    inlinePolicies: Policy[];
  };
}
interface IEcsResources {
}
export class EcsResources extends cdk.Construct implements IEcsResources {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    const iam = new Iam(this);
    iam.createResources({
      projectName: props.projectName,
      ecsTaskExecutionRole: { managedPolicies: props.ecsTaskExecutionRole.managedPolicies, inlinePolicies: props.ecsTaskExecutionRole.inlinePolicies },
      ecsTaskRole: { managedPolicies: props.ecsTaskRole.managedPolicies, inlinePolicies: props.ecsTaskRole.inlinePolicies },
    });

    const repository = new Repository(this);
    repository.createResources({ projectName: props.projectName });

    const taskdef = new TaskDefinition(this);
    taskdef.createResources({
      projectName: props.projectName, cpu: props.cpu, memoryLimitMiB: props.memoryLimitMiB, appPorts: props.appPorts, virtualNodeName: props.virtualNodeName,
      executionRole: iam.executionRole, taskRole: iam.taskRole, logGroup: props.logGroup, containers: props.containers,
    });

    const service = new Service(this);
    service.createResources({
      projectName: props.projectName, cluster: props.cluster, taskDefinition: taskdef.taskDefinition, namespace: props.namespace,
      desiredCount: props.desiredCount, securityGroups: props.securityGroups, subnets: props.subnets,
    });
  }
}
