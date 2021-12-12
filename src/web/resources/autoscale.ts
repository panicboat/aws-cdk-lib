import * as cdk from '@aws-cdk/core';
import * as autoscaling from '@aws-cdk/aws-applicationautoscaling'
import { Resource } from '../resource';
import { StepScalingProps, TargetTrackingScalingProps, ScaleCapacityProps } from '../props';
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

  public cpuStepScaling(props: StepScalingProps) {
    // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0#step-scaling
    if (props.scalingIntervals.length !== 0) {
      props.capacity.scaleOnMetric(`StepScaling4CpuUtilization-${props.projectName}`, {
        metric: props.service.metricCpuUtilization(),
        scalingSteps: props.scalingIntervals,
        adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      });
    }
  }

  public cpuTargetTrackingScaling(props: TargetTrackingScalingProps) {
    // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0?lang=typescript#target-tracking-scaling
    if (props.utilizationPercent !== 0) {
      props.capacity.scaleOnCpuUtilization(`TargetTrackingScaling4CpuUtilization-${props.projectName}`, {
        targetUtilizationPercent: props.utilizationPercent,
      });
    }
  }

  public memoryStepScaling(props: StepScalingProps) {
    // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0#step-scaling
    if (props.scalingIntervals.length !== 0) {
      props.capacity.scaleOnMetric(`StepScaling4MemoryUtilization-${props.projectName}`, {
        metric: props.service.metricMemoryUtilization(),
        scalingSteps: props.scalingIntervals,
        adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      });
    }
  }

  public memoryTargetTrackingScaling(props: TargetTrackingScalingProps) {
    // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0?lang=typescript#target-tracking-scaling
    if (props.utilizationPercent !== 0) {
      props.capacity.scaleOnMemoryUtilization(`TargetTrackingScaling4MemoryUtilization-${props.projectName}`, {
        targetUtilizationPercent: props.utilizationPercent,
      });
    }
  }
}
