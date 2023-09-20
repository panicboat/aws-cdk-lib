import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ICluster {
}
export interface ClusterProps {
  name: string
  vpc: cdk.aws_ec2.IVpc
  version: cdk.aws_eks.KubernetesVersion
  kubectlLayer?: lambda.ILayerVersion;
  endpointAccess?: cdk.aws_eks.EndpointAccess
}

export class Cluster extends Construct implements ICluster {
  public readonly cluster!: eks.Cluster;

  constructor(scope: Construct, id: string, props: ClusterProps) {
    super(scope, id);
    this.cluster = this.create(scope, id, props);
  }

  private create(scope: Construct, id: string, props: ClusterProps): eks.Cluster {
    const cluster = new eks.Cluster(scope, `EksCluster-${id}`, {
      clusterName: props.name,
      version: props.version,
      kubectlLayer: props.kubectlLayer,
      mastersRole: this.clusterRole(scope, id, props),
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
      vpc: props.vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],

      outputClusterName: true,
      endpointAccess: props.endpointAccess, // In Enterprise context, you may want to set it to PRIVATE.
    });
    return cluster;
  }

  /**
   * Create cluster role.
   * @param scope
   * @param id
   * @param props
   * @returns
   */
  private clusterRole(scope: Construct, id: string, props: ClusterProps): iam.IRole {
    const role = new iam.Role(scope, `EksClusterRole-${id}`, {
      roleName: `${id}-cluster-role`,
      assumedBy: new iam.AccountRootPrincipal()
    });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSServicePolicy'));
    role.attachInlinePolicy(new iam.Policy(scope, `EksClusterPolicy-${id}`, {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'eks:ListFargateProfiles',
            'eks:DescribeNodegroup',
            'eks:ListNodegroups',
            'eks:ListUpdates',
            'eks:AccessKubernetesApi',
            'eks:ListAddons',
            'eks:DescribeCluster',
            'eks:DescribeAddonVersions',
            'eks:ListClusters',
            'eks:ListIdentityProviderConfigs',
            'iam:ListRoles'
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ssm:GetParameter',
          ],
          resources: ["arn:aws:ssm:*:${cdk.Stack.of(scope).account}:parameter/*"],
        }),
      ],
    }));
    return role;
  }
}
