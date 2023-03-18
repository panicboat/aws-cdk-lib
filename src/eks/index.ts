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

  /**
   * Vpc creates a VPC that spans a whole region.
   * It will automatically divide the provided VPC CIDR range, and create public and private subnets per Availability Zone.
   * Network routing for the public subnets will be configured to allow outbound access directly via an Internet Gateway.
   * Network routing for the private subnets will be configured to allow outbound access via a set of resilient NAT Gateways (one per AZ).
   */
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);
    this.cluster(scope, id, props)
  }

  /**
   * Create a EKS cluster with Fargate profile.
   * @param id
   * @param props
   */
  private cluster(scope: Construct, id: string, props: Props) {
    const masterRole = this.role(scope, id, props)

    const cluster = new eks.FargateCluster(scope, `Cluster-${id}`, {
      version: eks.KubernetesVersion.V1_25,
      mastersRole: masterRole,
      clusterName: props.name,
      outputClusterName: true,
      endpointAccess: props.endpointAccess, // In Enterprise context, you may want to set it to PRIVATE.
      vpc: props.vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }]
    });
  }

  private role(scope: Construct, id: string, props: Props) {
    return new iam.Role(scope, `Role-${id}`, {
      assumedBy: new iam.AccountRootPrincipal()
    });
  }
}
