import * as cdk from '@aws-cdk/core';
import * as ecr from '@aws-cdk/aws-ecr';
import { Resource } from '../resource';

interface Props {
  projectName: string;
}
interface IRepository {
  readonly repository: ecr.IRepository;
  createResources(props: Props): void;
}
export class Repository extends Resource implements IRepository {
  public repository!: ecr.IRepository;
  public createResources(props: Props): void {
    this.repository = new ecr.Repository(this.scope, `Repository-${props.projectName}`, {
      repositoryName: props.projectName,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
