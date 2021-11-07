import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { ISecurityGroup, ISubnet } from '@aws-cdk/aws-ec2';
import { IManagedPolicy, Policy } from '@aws-cdk/aws-iam';
import { LogGroup } from '@aws-cdk/aws-logs';
import { ScalingInterval } from '@aws-cdk/aws-applicationautoscaling'
import { Iam } from './resources/iam';
import { TaskDefinition } from './resources/taskdefinition';
import { Service } from './resources/service';
import { AutoScale } from './resources/autoscale';
import { Listener } from './resources/listener';

interface Props {
  projectName: string;
  vpc: {
    subnets: ISubnet[];
    securityGroups: ISecurityGroup[];
  }
  ecs: {
    cpu: number;
    memoryLimitMiB: number;
    appPort: number;
    containers: ecs.ContainerDefinitionOptions[];
    logGroup: LogGroup;
    cluster: ecs.ICluster;
    role: {
      execution: {
        managedPolicies: IManagedPolicy[];
        inlinePolicies: Policy[];
      }
      task: {
        managedPolicies: IManagedPolicy[];
        inlinePolicies: Policy[];
      }
    }
  }
  autoScale: {
    minCapacity: number;
    maxCapacity: number;
    cpuUtilization?: {
      steps?: ScalingInterval[];
      target?: number;
    }
  }
  listener: {
    listenerArn: string;
    healthCheckPath: string;
    priority: number;
  }
}
interface IWebResource {
  readonly service: ecs.FargateService;
}
export class WebResource extends cdk.Construct implements IWebResource {
  public service!: ecs.FargateService;
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id);

    let cpuUtilization = props.autoScale.cpuUtilization || {}

    const iam = new Iam(this);
    iam.createResources({
      projectName: props.projectName,
      ecsTaskExecutionRole: { managedPolicies: props.ecs.role.execution.managedPolicies, inlinePolicies: props.ecs.role.execution.inlinePolicies },
      ecsTaskRole: { managedPolicies: props.ecs.role.task.managedPolicies, inlinePolicies: props.ecs.role.task.inlinePolicies },
    });

    const taskdef = new TaskDefinition(this);
    taskdef.createResources({
      projectName: props.projectName, cpu: props.ecs.cpu, memoryLimitMiB: props.ecs.memoryLimitMiB, appPorts: [props.ecs.appPort],
      executionRole: iam.executionRole, taskRole: iam.taskRole, logGroup: props.ecs.logGroup, containers: props.ecs.containers,
    });

    const service = new Service(this);
    service.createResources({
      projectName: props.projectName, cluster: props.ecs.cluster, taskDefinition: taskdef.taskDefinition,
      desiredCount: props.autoScale.minCapacity, securityGroups: props.vpc.securityGroups, subnets: props.vpc.subnets,
    });

    const autoscale = new AutoScale(this);
    autoscale.createResources({
      projectName: props.projectName, service: service.service,
      minCapacity: props.autoScale.minCapacity, maxCapacity: props.autoScale.maxCapacity,
      cpuUtilization: { steps: cpuUtilization.steps || [], target : cpuUtilization.target || 0, }
    });

    const listener = new Listener(this);
    listener.createResources({
      projectName: props.projectName, vpc: props.ecs.cluster.vpc,
      targets: [service.service], listenerArn: props.listener.listenerArn,
      port: props.ecs.appPort, priority: props.listener.priority, healthCheckPath: props.listener.healthCheckPath
    })

    this.service = service.service;
  }
}
