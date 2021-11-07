import * as cdk from '@aws-cdk/core';
import * as alb from '@aws-cdk/aws-elasticloadbalancingv2';
import { IVpc } from '@aws-cdk/aws-ec2';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  vpc: IVpc;
  targets: alb.IApplicationLoadBalancerTarget[];
  listenerArn: string;
  port: number;
  priority: number;
  healthCheckPath: string;
}
interface IListener {
  createResources(props: Props): void;
}
export class Listener extends Resource implements IListener {

  public createResources(props: Props): void {
    const targetGroup = this.createTargetGroup(this.scope, props)
    this.createListenerRule(this.scope, props, [targetGroup]);
  }

  private createTargetGroup(scope: cdk.Construct, props: Props): alb.ApplicationTargetGroup {
    return new alb.ApplicationTargetGroup(scope, `TargetGroup-${props.projectName}`, {
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

  private createListenerRule(scope: cdk.Construct, props: Props, targetGroups: alb.IApplicationTargetGroup[]) {
    return new alb.ApplicationListenerRule(scope, `ListenerRule-${props.projectName}`, {
      action: alb.ListenerAction.forward(targetGroups),
      conditions: [
        alb.ListenerCondition.pathPatterns(['/maniax-touch/','/maniax-touch','/_nuxt*']),
      ],
      listener: alb.ApplicationListener.fromLookup(scope, `Listener-${props.projectName}`, { listenerArn: props.listenerArn }),
      priority: props.priority,
    });
  }
}
