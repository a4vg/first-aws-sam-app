"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
// import codecommit = require('@aws-cdk/aws-codecommit');
const codepipeline = require("@aws-cdk/aws-codepipeline");
const codepipeline_actions = require("@aws-cdk/aws-codepipeline-actions");
const codebuild = require("@aws-cdk/aws-codebuild");
class PipelineStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // SOURCE STAGE -------------------------------------------------
        // The code that defines your stack goes here
        const artifactsBucket = new s3.Bucket(this, "ArtifactsBucket");
        // Import existing CodeCommit sam-app repository
        // const codeRepo = codecommit.Repository.fromRepositoryName(
        //   this,
        //   'AppRepository', // Logical name within CloudFormation
        //   'sam-app' // Repository name
        // );
        // Pipeline creation starts
        const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
            artifactBucket: artifactsBucket
        });
        // Declare source code as an artifact
        const sourceOutput = new codepipeline.Artifact();
        // Add source stage to pipeline
        pipeline.addStage({
            stageName: 'Source',
            actions: [
                new codepipeline_actions.GitHubSourceAction({
                    actionName: 'Checkout',
                    owner: "andrea-velasquez",
                    repo: "first-aws-sam-app",
                    oauthToken: cdk.SecretValue.plainText(props.githubToken),
                    trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
                    output: sourceOutput,
                }),
            ],
        });
        // BUILD STAGE -------------------------------------------------
        // Declare build output as artifacts
        const buildOutput = new codepipeline.Artifact();
        // Declare a new CodeBuild project
        const buildProject = new codebuild.PipelineProject(this, 'Build', {
            environment: { buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2 },
            environmentVariables: {
                'PACKAGE_BUCKET': {
                    value: artifactsBucket.bucketName
                }
            }
        });
        // Add the build stage to our pipeline
        pipeline.addStage({
            stageName: 'Build',
            actions: [
                new codepipeline_actions.CodeBuildAction({
                    actionName: 'Build',
                    project: buildProject,
                    input: sourceOutput,
                    outputs: [buildOutput],
                }),
            ],
        });
        // DEPLOY STAGE -------------------------------------------------
        pipeline.addStage({
            stageName: 'Dev',
            actions: [
                new codepipeline_actions.CloudFormationCreateReplaceChangeSetAction({
                    actionName: 'CreateChangeSet',
                    templatePath: buildOutput.atPath("packaged.yaml"),
                    stackName: 'first-aws-sam-app',
                    adminPermissions: true,
                    changeSetName: 'first-aws-sam-app-dev-changeset',
                    runOrder: 1
                }),
                new codepipeline_actions.CloudFormationExecuteChangeSetAction({
                    actionName: 'Deploy',
                    stackName: 'first-aws-sam-app',
                    changeSetName: 'first-aws-sam-app-dev-changeset',
                    runOrder: 2
                }),
            ],
        });
    }
}
exports.PipelineStack = PipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHFDQUFxQztBQUNyQyxzQ0FBdUM7QUFDdkMsMERBQTBEO0FBQzFELDBEQUEyRDtBQUMzRCwwRUFBMkU7QUFDM0Usb0RBQXFEO0FBTXJELE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzFDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBeUI7UUFDckUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsaUVBQWlFO1FBQ2pFLDZDQUE2QztRQUM3QyxNQUFNLGVBQWUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFFL0QsZ0RBQWdEO1FBQ2hELDZEQUE2RDtRQUM3RCxVQUFVO1FBQ1YsMkRBQTJEO1FBQzNELGlDQUFpQztRQUNqQyxLQUFLO1FBRUwsMkJBQTJCO1FBQzNCLE1BQU0sUUFBUSxHQUFHLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzNELGNBQWMsRUFBRSxlQUFlO1NBQ2hDLENBQUMsQ0FBQztRQUVILHFDQUFxQztRQUNyQyxNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUVqRCwrQkFBK0I7UUFDL0IsUUFBUSxDQUFDLFFBQVEsQ0FBQztZQUNoQixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQztvQkFDMUMsVUFBVSxFQUFFLFVBQVU7b0JBQ3RCLEtBQUssRUFBRSxrQkFBa0I7b0JBQ3pCLElBQUksRUFBRSxtQkFBbUI7b0JBQ3pCLFVBQVUsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO29CQUN4RCxPQUFPLEVBQUUsb0JBQW9CLENBQUMsYUFBYSxDQUFDLE9BQU87b0JBQ25ELE1BQU0sRUFBRSxZQUFZO2lCQUNyQixDQUFDO2FBQ0g7U0FDRixDQUFDLENBQUM7UUFFSCxnRUFBZ0U7UUFDaEUsb0NBQW9DO1FBQ3BDLE1BQU0sV0FBVyxHQUFHLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRWhELGtDQUFrQztRQUNsQyxNQUFNLFlBQVksR0FBRyxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUNoRSxXQUFXLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRTtZQUN2RSxvQkFBb0IsRUFBRTtnQkFDcEIsZ0JBQWdCLEVBQUU7b0JBQ2hCLEtBQUssRUFBRSxlQUFlLENBQUMsVUFBVTtpQkFDbEM7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHNDQUFzQztRQUN0QyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQ2hCLFNBQVMsRUFBRSxPQUFPO1lBQ2xCLE9BQU8sRUFBRTtnQkFDUCxJQUFJLG9CQUFvQixDQUFDLGVBQWUsQ0FBQztvQkFDdkMsVUFBVSxFQUFFLE9BQU87b0JBQ25CLE9BQU8sRUFBRSxZQUFZO29CQUNyQixLQUFLLEVBQUUsWUFBWTtvQkFDbkIsT0FBTyxFQUFFLENBQUMsV0FBVyxDQUFDO2lCQUN2QixDQUFDO2FBQ0g7U0FDRixDQUFDLENBQUM7UUFFSCxpRUFBaUU7UUFDakUsUUFBUSxDQUFDLFFBQVEsQ0FBQztZQUNoQixTQUFTLEVBQUUsS0FBSztZQUNoQixPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxvQkFBb0IsQ0FBQywwQ0FBMEMsQ0FBQztvQkFDbEUsVUFBVSxFQUFFLGlCQUFpQjtvQkFDN0IsWUFBWSxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDO29CQUNqRCxTQUFTLEVBQUUsbUJBQW1CO29CQUM5QixnQkFBZ0IsRUFBRSxJQUFJO29CQUN0QixhQUFhLEVBQUUsaUNBQWlDO29CQUNoRCxRQUFRLEVBQUUsQ0FBQztpQkFDWixDQUFDO2dCQUNGLElBQUksb0JBQW9CLENBQUMsb0NBQW9DLENBQUM7b0JBQzVELFVBQVUsRUFBRSxRQUFRO29CQUNwQixTQUFTLEVBQUUsbUJBQW1CO29CQUM5QixhQUFhLEVBQUUsaUNBQWlDO29CQUNoRCxRQUFRLEVBQUUsQ0FBQztpQkFDWixDQUFDO2FBQ0g7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF0RkQsc0NBc0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0IHMzID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLXMzJyk7XG4vLyBpbXBvcnQgY29kZWNvbW1pdCA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1jb2RlY29tbWl0Jyk7XG5pbXBvcnQgY29kZXBpcGVsaW5lID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZScpO1xuaW1wb3J0IGNvZGVwaXBlbGluZV9hY3Rpb25zID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJyk7XG5pbXBvcnQgY29kZWJ1aWxkID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWNvZGVidWlsZCcpO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBpcGVsaW5lU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgcmVhZG9ubHkgZ2l0aHViVG9rZW46IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFBpcGVsaW5lU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFBpcGVsaW5lU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gU09VUkNFIFNUQUdFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBUaGUgY29kZSB0aGF0IGRlZmluZXMgeW91ciBzdGFjayBnb2VzIGhlcmVcbiAgICBjb25zdCBhcnRpZmFjdHNCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsIFwiQXJ0aWZhY3RzQnVja2V0XCIpO1xuXG4gICAgLy8gSW1wb3J0IGV4aXN0aW5nIENvZGVDb21taXQgc2FtLWFwcCByZXBvc2l0b3J5XG4gICAgLy8gY29uc3QgY29kZVJlcG8gPSBjb2RlY29tbWl0LlJlcG9zaXRvcnkuZnJvbVJlcG9zaXRvcnlOYW1lKFxuICAgIC8vICAgdGhpcyxcbiAgICAvLyAgICdBcHBSZXBvc2l0b3J5JywgLy8gTG9naWNhbCBuYW1lIHdpdGhpbiBDbG91ZEZvcm1hdGlvblxuICAgIC8vICAgJ3NhbS1hcHAnIC8vIFJlcG9zaXRvcnkgbmFtZVxuICAgIC8vICk7XG5cbiAgICAvLyBQaXBlbGluZSBjcmVhdGlvbiBzdGFydHNcbiAgICBjb25zdCBwaXBlbGluZSA9IG5ldyBjb2RlcGlwZWxpbmUuUGlwZWxpbmUodGhpcywgJ1BpcGVsaW5lJywge1xuICAgICAgYXJ0aWZhY3RCdWNrZXQ6IGFydGlmYWN0c0J1Y2tldFxuICAgIH0pO1xuXG4gICAgLy8gRGVjbGFyZSBzb3VyY2UgY29kZSBhcyBhbiBhcnRpZmFjdFxuICAgIGNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoKTtcblxuICAgIC8vIEFkZCBzb3VyY2Ugc3RhZ2UgdG8gcGlwZWxpbmVcbiAgICBwaXBlbGluZS5hZGRTdGFnZSh7XG4gICAgICBzdGFnZU5hbWU6ICdTb3VyY2UnLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiAnQ2hlY2tvdXQnLFxuICAgICAgICAgIG93bmVyOiBcImFuZHJlYS12ZWxhc3F1ZXpcIixcbiAgICAgICAgICByZXBvOiBcImZpcnN0LWF3cy1zYW0tYXBwXCIsXG4gICAgICAgICAgb2F1dGhUb2tlbjogY2RrLlNlY3JldFZhbHVlLnBsYWluVGV4dChwcm9wcy5naXRodWJUb2tlbiksXG4gICAgICAgICAgdHJpZ2dlcjogY29kZXBpcGVsaW5lX2FjdGlvbnMuR2l0SHViVHJpZ2dlci5XRUJIT09LLFxuICAgICAgICAgIG91dHB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBCVUlMRCBTVEFHRSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gRGVjbGFyZSBidWlsZCBvdXRwdXQgYXMgYXJ0aWZhY3RzXG4gICAgY29uc3QgYnVpbGRPdXRwdXQgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCk7XG5cbiAgICAvLyBEZWNsYXJlIGEgbmV3IENvZGVCdWlsZCBwcm9qZWN0XG4gICAgY29uc3QgYnVpbGRQcm9qZWN0ID0gbmV3IGNvZGVidWlsZC5QaXBlbGluZVByb2plY3QodGhpcywgJ0J1aWxkJywge1xuICAgICAgZW52aXJvbm1lbnQ6IHsgYnVpbGRJbWFnZTogY29kZWJ1aWxkLkxpbnV4QnVpbGRJbWFnZS5BTUFaT05fTElOVVhfMl8yIH0sXG4gICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICAnUEFDS0FHRV9CVUNLRVQnOiB7XG4gICAgICAgICAgdmFsdWU6IGFydGlmYWN0c0J1Y2tldC5idWNrZXROYW1lXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFkZCB0aGUgYnVpbGQgc3RhZ2UgdG8gb3VyIHBpcGVsaW5lXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnQnVpbGQnLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgICAgICBhY3Rpb25OYW1lOiAnQnVpbGQnLFxuICAgICAgICAgIHByb2plY3Q6IGJ1aWxkUHJvamVjdCxcbiAgICAgICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgICAgIG91dHB1dHM6IFtidWlsZE91dHB1dF0sXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIERFUExPWSBTVEFHRSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgcGlwZWxpbmUuYWRkU3RhZ2Uoe1xuICAgICAgc3RhZ2VOYW1lOiAnRGV2JyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkNsb3VkRm9ybWF0aW9uQ3JlYXRlUmVwbGFjZUNoYW5nZVNldEFjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogJ0NyZWF0ZUNoYW5nZVNldCcsXG4gICAgICAgICAgdGVtcGxhdGVQYXRoOiBidWlsZE91dHB1dC5hdFBhdGgoXCJwYWNrYWdlZC55YW1sXCIpLFxuICAgICAgICAgIHN0YWNrTmFtZTogJ2ZpcnN0LWF3cy1zYW0tYXBwJyxcbiAgICAgICAgICBhZG1pblBlcm1pc3Npb25zOiB0cnVlLFxuICAgICAgICAgIGNoYW5nZVNldE5hbWU6ICdmaXJzdC1hd3Mtc2FtLWFwcC1kZXYtY2hhbmdlc2V0JyxcbiAgICAgICAgICBydW5PcmRlcjogMVxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkNsb3VkRm9ybWF0aW9uRXhlY3V0ZUNoYW5nZVNldEFjdGlvbih7XG4gICAgICAgICAgYWN0aW9uTmFtZTogJ0RlcGxveScsXG4gICAgICAgICAgc3RhY2tOYW1lOiAnZmlyc3QtYXdzLXNhbS1hcHAnLFxuICAgICAgICAgIGNoYW5nZVNldE5hbWU6ICdmaXJzdC1hd3Mtc2FtLWFwcC1kZXYtY2hhbmdlc2V0JyxcbiAgICAgICAgICBydW5PcmRlcjogMlxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cbn0iXX0=