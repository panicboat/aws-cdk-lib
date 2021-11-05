import * as cdk from '@aws-cdk/core';
import * as autoscaling from '@aws-cdk/aws-applicationautoscaling'
import { FargateService } from '@aws-cdk/aws-ecs';
import { Resource } from '../resource';

interface Props {
  projectName: string;
  service: FargateService;
  minCapacity: number;
  maxCapacity: number;
  cpuUtilization: {
    steps: autoscaling.ScalingInterval[];
    target: number;
  }
}
interface IAutoScale {
  createResources(props: Props): void;
}
export class AutoScale extends Resource implements IAutoScale {
  public createResources(props: Props): void {
    if (props.minCapacity === props.maxCapacity) {
      return;
    }

    const capacity = props.service.autoScaleTaskCount({
      minCapacity: props.minCapacity,
      maxCapacity: props.maxCapacity,
    });

    // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0#step-scaling
    if (props.cpuUtilization.steps.length !== 0) {
      capacity.scaleOnMetric(`StepScaling4CpuUtilization-${props.projectName}`, {
        metric: props.service.metricCpuUtilization(),
        scalingSteps: props.cpuUtilization.steps,
        adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      });
    }

    // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0?lang=typescript#target-tracking-scaling
    if (props.cpuUtilization.target !== 0) {
      capacity.scaleOnCpuUtilization(`TargetTrackingScaling4CpuUtilization-${props.projectName}`, {
        targetUtilizationPercent: props.cpuUtilization.target,
      });
    }
  }
}
