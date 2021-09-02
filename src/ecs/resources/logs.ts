import * as cdk from '@aws-cdk/core';
import * as logs from '@aws-cdk/aws-logs';
import { Resource } from '../resource';

interface Props {
  projectName: string;
}
interface ILogs {
  readonly logGroup: logs.ILogGroup;
  createResources(props: Props): void;
}
export class Logs extends Resource implements ILogs {
  public logGroup!: logs.ILogGroup;
  public createResources(props: Props): void {
    this.logGroup = new logs.LogGroup(this.scope, `LogGroup-${props.projectName}`, {
      logGroupName: `/ecs/${props.projectName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
