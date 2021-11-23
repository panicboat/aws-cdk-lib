import * as cdk from '@aws-cdk/core';
import * as autoscaling from '@aws-cdk/aws-applicationautoscaling'
import { Resource } from '../resource';
import { CpuStepScalingProps, CpuTargetTrackingScalingProps, ScaleCapacityProps } from '../props';
import { ScalableTaskCount } from '@aws-cdk/aws-ecs';

interface IAutoScale {
  createCapacity(props: ScaleCapacityProps): ScalableTaskCount;
}
export class AutoScale extends Resource implements IAutoScale {

  public createCapacity(props: ScaleCapacityProps) {
    const capacity = props.service.autoScaleTaskCount({
      minCapacity: props.minCapacity,
      maxCapacity: props.maxCapacity,
    });
    return capacity;
  }

  public cpuStepScaling(props: CpuStepScalingProps) {
    // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0#step-scaling
    if (props.scalingIntervals.length !== 0) {
      props.capacity.scaleOnMetric(`StepScaling4CpuUtilization-${props.projectName}`, {
        metric: props.service.metricCpuUtilization(),
        scalingSteps: props.scalingIntervals,
        adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      });
    }
  }

  public cpuTargetTrackingScaling(props: CpuTargetTrackingScalingProps) {
    // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0?lang=typescript#target-tracking-scaling
    if (props.cpuUtilizationPercent !== 0) {
      props.capacity.scaleOnCpuUtilization(`TargetTrackingScaling4CpuUtilization-${props.projectName}`, {
        targetUtilizationPercent: props.cpuUtilizationPercent,
      });
    }
  }
}
