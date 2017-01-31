# Reservation client

Simple client for the [reservation-api](https://github.com/phusu/reservation-api) project. The client displays a calendar for the next five weeks with one hour slots, shows available and reserved slots and gives the ability to reserve a slot and cancel your own reservation by clicking the respective slot.

## Implementation details
Written with basic HTML, CSS and JavaScript. Uses Bootstrap CSS, jQuery, Moment.JS and AWS Cognito Javascript SDK libraries. 

User authentication is handled with AWS Cognito. A user pool is maintained by administrators, users cannot register themselves. The client supports basic authentication and forgot password flow. 

In my use the client first authenticates the user against AWS Cognito (login.html). If authentication is successful, it will give access to the functions in the Reservation API (index.html). Whole website is stored in AWS S3 bucket as a static website and distributed via AWS CloudFront. 

## Goals of the project
- Learn the basic workflow of user authentication with AWS Cognito
- Learn to use a simple REST API with custom headers needed for authorization

## Steps needed for use
- Create a user pool in AWS Cognito, mark down the user pool ID
- Create an application in AWS Cognito for the user pool, mark down the client ID
- Create a user to the user pool
- Fill in the user pool & client ID to both client.js and loginclient.js
- Fill in the Reservation API endpoint to client.js
