import * as cdk from '@aws-cdk/core';
import * as alb from '@aws-cdk/aws-elasticloadbalancingv2';
import { Resource } from '../resource';
import { ListenerProps, TargetGroupProps } from '../props';

interface IListener {
  createTargetGroup(props: TargetGroupProps): alb.ApplicationTargetGroup;
  createListenerRule(props: ListenerProps): alb.ApplicationListenerRule;
}
export class Listener extends Resource implements IListener {

  public createTargetGroup(props: TargetGroupProps) {
    return new alb.ApplicationTargetGroup(this.scope, `TargetGroup-${props.projectName}`, {
      targetGroupName: props.projectName,
      targetType: alb.TargetType.IP,
      targets: props.targets,
      protocol: alb.ApplicationProtocol.HTTP,
      port: props.port,
      loadBalancingAlgorithmType: alb.TargetGroupLoadBalancingAlgorithmType.LEAST_OUTSTANDING_REQUESTS,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        healthyThresholdCount: 3,
        interval: cdk.Duration.seconds(30),
        path: props.healthCheckPath,
        protocol: alb.Protocol.HTTP,
        timeout: cdk.Duration.seconds(6),
        unhealthyThresholdCount: 3,
      },
      vpc: props.vpc,
    });
  }

  public createListenerRule(props: ListenerProps) {
    return new alb.ApplicationListenerRule(this.scope, `ListenerRule-${props.projectName}`, {
      action: alb.ListenerAction.forward(props.targetGroups),
      conditions: [
        alb.ListenerCondition.pathPatterns(['/maniax-touch/','/maniax-touch','/_nuxt*']),
      ],
      listener: alb.ApplicationListener.fromLookup(this.scope, `Listener-${props.projectName}`, { listenerArn: props.listenerArn }),
      priority: props.priority,
    });
  }
}
