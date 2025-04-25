# Serverless Application with AWS

This project implements a serverless application using AWS services including Cognito, API Gateway, Lambda, DynamoDB, and SNS.

## Architecture

The application consists of the following components:

1. **User Authentication**: Amazon Cognito for user sign-up and login
2. **API**: Amazon API Gateway for handling HTTP requests
3. **Data Processing**: AWS Lambda functions for processing data
4. **Data Storage**: Amazon DynamoDB for storing user data
5. **Notifications**: Amazon SNS for sending reminders and notifications

## Directory Structure

```
.
├── README.md
├── template.yaml                # CloudFormation template
└── src
    ├── frontend                 # Frontend code
    │   ├── index.html
    │   └── app.js
    └── lambda                   # Lambda functions
        ├── process_data.js      # Process and store data
        ├── get_user_data.js     # Retrieve user data
        └── send_reminder.js     # Send notifications
```

## Deployment Instructions

### Prerequisites

- AWS CLI installed and configured
- AWS SAM CLI installed
- Node.js and npm installed

### Steps to Deploy

1. **Package the application**:

   ```bash
   sam package --template-file template.yaml --output-template-file packaged.yaml --s3-bucket YOUR_S3_BUCKET
   ```

2. **Deploy the application**:

   ```bash
   sam deploy --template-file packaged.yaml --stack-name serverless-app --capabilities CAPABILITY_IAM
   ```

3. **Get the outputs**:

   ```bash
   aws cloudformation describe-stacks --stack-name serverless-app --query "Stacks[0].Outputs"
   ```

4. **Update the frontend configuration**:

   Open `src/frontend/app.js` and update the AWS configuration with the values from the CloudFormation outputs:

   ```javascript
   const awsConfig = {
       region: 'YOUR_REGION',
       userPoolId: 'YOUR_USER_POOL_ID',
       userPoolWebClientId: 'YOUR_USER_POOL_CLIENT_ID',
       apiEndpoint: 'YOUR_API_GATEWAY_URL'
   };
   ```

5. **Host the frontend**:

   You can host the frontend on Amazon S3, CloudFront, or any other web hosting service.

## Usage

1. **Sign Up**:
   - Navigate to the application URL
   - Click on "Sign Up" tab
   - Enter your name, email, and password
   - Verify your email address with the verification code

2. **Login**:
   - Enter your email and password
   - Click "Login"

3. **Submit Data**:
   - Fill out the form with title and content
   - Optionally set a reminder
   - Click "Submit"

4. **View Data**:
   - Your submitted data will appear in the "Your Data" section
   - Data with reminders will show the reminder date

## Features

- **User Authentication**: Secure sign-up and login with Cognito
- **Data Management**: Submit and retrieve user data
- **Reminders**: Set reminders that trigger notifications
- **Responsive UI**: Works on desktop and mobile devices

## Security

- API endpoints are secured with Cognito authorizers
- DynamoDB access is restricted by IAM policies
- HTTPS is enforced for all API calls

## Customization

You can customize the application by:

1. Modifying the CloudFormation template to add or change AWS resources
2. Updating the Lambda functions to change business logic
3. Enhancing the frontend for better user experience

## Troubleshooting

- **Deployment Issues**: Check CloudFormation events for error messages
- **Authentication Problems**: Verify Cognito settings and client configuration
- **API Errors**: Check Lambda logs in CloudWatch
- **Data Issues**: Examine DynamoDB tables and access patterns

## License

This project is licensed under the MIT License - see the LICENSE file for details.

