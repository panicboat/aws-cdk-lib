import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ICluster {
}
export interface Props {
  name: string
  endpointAccess?: cdk.aws_eks.EndpointAccess
  version: cdk.aws_eks.KubernetesVersion
  vpc: cdk.aws_ec2.IVpc
}

export class FargateCluster extends Construct implements ICluster {
  public readonly cluster!: eks.ICluster;

  /**
   * FargateCluster creates a EKS cluster with Fargate profile.
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);
    this.cluster = this.create(scope, id, props);
  }

  /**
   * Create a EKS cluster with Fargate profile.
   * @param id
   * @param props
   * @returns eks.ICluster
   */
  private create(scope: Construct, id: string, props: Props): eks.ICluster {
    const mastersRole = this.role(scope, id, props);
    return new eks.FargateCluster(scope, `EksCluster-${id}`, {
      version: eks.KubernetesVersion.V1_25,
      mastersRole: mastersRole,
      clusterName: props.name,
      outputClusterName: true,
      endpointAccess: props.endpointAccess, // In Enterprise context, you may want to set it to PRIVATE.
      vpc: props.vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }]
    });
  }

  /**
   * Create a role for EKS cluster.
   * @param scope
   * @param id
   * @param props
   * @returns
   */
  private role(scope: Construct, id: string, props: Props): iam.IRole {
    return new iam.Role(scope, `EksAdminRole-${id}`, {
      roleName: `${id}AdminRole`,
      assumedBy: new iam.AccountRootPrincipal()
    });
  }
}
