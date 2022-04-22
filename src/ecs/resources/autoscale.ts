import * as cdk from '@aws-cdk/core';
import * as autoscaling from '@aws-cdk/aws-applicationautoscaling'
import { Resource } from '../resource';
import { StepScalingProps, TargetTrackingScalingProps, ScaleCapacityProps, ScheduledScalingProps } from '../props';
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
    if (props.scalingIntervals.length !== 0) {
      // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0#step-scaling
      props.capacity.scaleOnMetric(`StepScaling4CpuUtilization-${props.projectName}`, {
        metric: props.service.metricCpuUtilization({
          period: cdk.Duration.minutes(3),
          statistic: 'Average',
        }),
        scalingSteps: props.scalingIntervals,
        adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
        cooldown: cdk.Duration.seconds(30),
      });
    }
  }

  public memoryStepScaling(props: StepScalingProps) {
    if (props.scalingIntervals.length !== 0) {
      // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0#step-scaling
      props.capacity.scaleOnMetric(`StepScaling4MemoryUtilization-${props.projectName}`, {
        metric: props.service.metricMemoryUtilization({
          period: cdk.Duration.minutes(3),
          statistic: 'Average',
        }),
        scalingSteps: props.scalingIntervals,
        adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
        cooldown: cdk.Duration.seconds(30),
      });
    }
  }

  public cpuTargetTrackingScaling(props: TargetTrackingScalingProps) {
    if (props.utilizationPercent !== 0) {
      // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0?lang=typescript#target-tracking-scaling
      props.capacity.scaleOnCpuUtilization(`TargetTrackingScaling4CpuUtilization-${props.projectName}`, {
        targetUtilizationPercent: props.utilizationPercent,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(30),
      });
    }
  }

  public memoryTargetTrackingScaling(props: TargetTrackingScalingProps) {
    if (props.utilizationPercent !== 0) {
      // https://constructs.dev/packages/@aws-cdk/aws-applicationautoscaling/v/1.117.0?lang=typescript#target-tracking-scaling
      props.capacity.scaleOnMemoryUtilization(`TargetTrackingScaling4MemoryUtilization-${props.projectName}`, {
        targetUtilizationPercent: props.utilizationPercent,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(30),
      });
    }
  }

  public scheduledScaliung(props: ScheduledScalingProps) {
    props.schedules.forEach((schedule, index) => {
      props.capacity.scaleOnSchedule(`ScheduledScaling-${props.projectName}-${index}`, schedule);
    });
  }
}
