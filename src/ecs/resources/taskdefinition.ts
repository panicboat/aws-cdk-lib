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
    taskDefinition.addContainer('envoy', {
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
        APPMESH_METRIC_EXTENSION_VERSION: '1',
        ENVOY_LOG_LEVEL: 'info',
        APPMESH_XDS_ENDPOINT: '',
        ENABLE_ENVOY_XRAY_TRACING: '1',
        ENABLE_ENVOY_STATS_TAGS: '1',
      },
      logging: ecs.LogDrivers.firelens({
        options: {
          Name: 'cloudwatch',
          region: this.stack.region,
          log_group_name: props.logGroup.logGroupName,
          log_stream_prefix: '',
        },
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -s http://localhost:9901/server_info | grep state | grep -q LIVE'],
        interval: cdk.Duration.seconds(5),
        timeout: cdk.Duration.seconds(2),
        retries: 3,
      },
    });
    taskDefinition.addContainer('xray-daemon', {
      containerName: 'xray-daemon',
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/xray/aws-xray-daemon:latest'),
      user: '1337',
      essential: true,
      portMappings: [
        { containerPort: 2000, hostPort: 2000, protocol: ecs.Protocol.UDP },
      ],
      logging: ecs.LogDrivers.firelens({
        options: {
          Name: 'cloudwatch',
          region: this.stack.region,
          log_group_name: props.logGroup.logGroupName,
          log_stream_prefix: '',
        },
      }),
    });
    taskDefinition.addFirelensLogRouter('fluent-bit', {
      firelensConfig: {
        type: ecs.FirelensLogRouterType.FLUENTBIT,
      },
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-for-fluent-bit:latest')
    });
    props.containers.forEach(container => {
      taskDefinition.addContainer(container.containerName!, container);
    });
    return taskDefinition;
  }
}
