import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import { ILogGroup } from '@aws-cdk/aws-logs';
import { Resource } from '../resource';
import { IRole } from '@aws-cdk/aws-iam';

interface Props {
  projectName: string;
  cpu: number;
  memoryLimitMiB: number;
  appPorts: number[];
  virtualNodeName: string;
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
      proxyConfiguration: new ecs.AppMeshProxyConfiguration({
        containerName: 'envoy',
        properties: {
          appPorts: props.appPorts,
          proxyIngressPort: 15000,
          proxyEgressPort: 15001,
          ignoredUID: 1337,
          egressIgnoredIPs: ['169.254.170.2','169.254.169.254'],
        }
      }),
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      taskRole: props.taskRole,
      executionRole: props.executionRole,
    });
    this.taskDefinition.addContainer('envoy', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/appmesh/aws-appmesh-envoy:v1.19.1.0-prod'),
      containerName: 'envoy',
      user: '1337',
      essential: true,
      portMappings: [
        { containerPort: 9901, hostPort: 9901, protocol: ecs.Protocol.TCP },
        { containerPort: 15000, hostPort: 15000, protocol: ecs.Protocol.TCP },
        { containerPort: 15001, hostPort: 15001, protocol: ecs.Protocol.TCP },
      ],
      environment: {
        APPMESH_VIRTUAL_NODE_NAME: props.virtualNodeName,
        ENVOY_LOG_LEVEL: 'info',
        APPMESH_XDS_ENDPOINT: '',
        ENABLE_ENVOY_XRAY_TRACING: '1',
        ENABLE_ENVOY_STATS_TAGS: '1',
      },
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: `${props.projectName}-envoy`,
        logGroup: props.logGroup,
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE'],
        interval: cdk.Duration.seconds(5),
        timeout: cdk.Duration.seconds(2),
        retries: 3,
      },
    });
    this.taskDefinition.addContainer('xray-daemon', {
      containerName: 'xray-daemon',
      image: ecs.ContainerImage.fromRegistry('amazon/aws-xray-daemon'),
      user: '1337',
      essential: true,
      cpu: 32,
      memoryReservationMiB: 256,
      portMappings: [
        { containerPort: 2000, hostPort: 2000, protocol: ecs.Protocol.UDP },
      ],
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: `${props.projectName}-xray`,
        logGroup: props.logGroup,
      }),
    });
    props.containers.forEach(container => {
      this.taskDefinition.addContainer(container.containerName!, container);
    });
  }
}
