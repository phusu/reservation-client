var storedUserAttributes;
var cognitoUser;
var needVerificationCode = false;

$(document).ready(function () {
    $("#signInButton").click(function () {
        var authenticationData = {
            Username: $("#userNameField").val(),
            Password: $("#passwordField").val(),
        };
        var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
        var poolData = {
            UserPoolId: <<YOUR_USER_POOL_ID>>, // Your user pool id here
            ClientId: <<YOUR_CLIENT_ID>> // Your client id here
        };
        var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
        var userData = {
            Username: $("#userNameField").val(),
            Pool: userPool
        };
        cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                $("#loginPromptHeader").text('Logged in successfully. Redirecting...');
                $("#statusText").text('');
                $("#loginArea").hide();
                $("#newPwArea").hide();

                // Continue
                setTimeout(function () {
                    window.location.replace("index.html");
                }, 1000);
            },

            onFailure: function (err) {
                console.log(JSON.stringify(err));
                if (err.code === 'UserNotFoundException') {
                    $("#statusText").text('User not found. Try again.');
                }
                else if (err.code === 'NotAuthorizedException') {
                    $("#statusText").text('Wrong password. Try again.');
                    $("#forgotPwButton").show();
                }
                else if (err.code === 'PasswordResetRequiredException') {
                    $("#loginArea").hide();
                    $("#newPwArea").show();
                    $("#verificationCodeArea").show();
                }
            },

            newPasswordRequired: function (userAttributes, requiredAttributes) {
                // User was signed up by an admin and must provide new 
                // password and required attributes, if any, to complete 
                // authentication.

                // the api doesn't accept this field back
                delete userAttributes.email_verified;
                storedUserAttributes = userAttributes;

                // Set up the html page
                $("#loginPromptHeader").text('Password change is required');
                $("#statusText").text('');
                $("#loginArea").hide();
                $("#newPwArea").show();
            }

        });
    });

    $("#passwordField").keypress(function (event) {
        if (event.keyCode == 13) {
            $("#signInButton").click();
        }
    });


    $("#passwordField2").keypress(function (event) {
        if (event.keyCode == 13) {
            $("#changePwButton").click();
        }
    });

    $("#passwordField4").keypress(function (event) {
        if (event.keyCode == 13) {
            $("#forgotPwButton").click();
        }
    });

    $("#changePwButton").click(function () {
        if ($("#passwordField1").val() === '' || $("#passwordField2").val() === '') {
            alert('Password field is empty!');
            return;
        }

        if ($("#passwordField1").val() === $("#passwordField2").val()) {
            var newPassword = $("#passwordField1").val();

            if (needVerificationCode) {
                var verificationCode = $("#verificationCodeField").val();

                if (verificationCode === '') {
                    alert('Please enter verification code.');
                }
                else {
                    cognitoUser.confirmPassword(verificationCode, newPassword, {
                        onSuccess: function (result) {
                            $("#loginPromptHeader").text('Password changed successfully. You will be redirected to login again...');
                            $("#statusText").text('');
                            $("#loginArea").hide();
                            $("#newPwArea").hide();

                            // Continue
                            setTimeout(function () {
                                window.location.replace("index.html");
                            }, 2000);
                        },

                        onFailure: function (err) {
                            console.log(JSON.stringify(err));
                            alert(err);
                        }
                    });
                }
            }
            else {
                cognitoUser.completeNewPasswordChallenge(newPassword, storedUserAttributes, {
                    onSuccess: function (result) {
                        storedUserAttributes = null;

                        $("#loginPromptHeader").text('Password changed successfully. Redirecting...');
                        $("#statusText").text('');
                        $("#loginArea").hide();
                        $("#newPwArea").hide();

                        // Continue
                        setTimeout(function () {
                            window.location.replace("index.html");
                        }, 2000);
                    },

                    onFailure: function (err) {
                        alert(err);
                    }
                });
            }
        }
        else {
            alert('Passwords don\'t match!');
        }
    });

    $("#forgotPwButton").click(function () {
        cognitoUser.forgotPassword({
            onSuccess: function (result) {
                needVerificationCode = true;
            },
            onFailure: function (err) {
                alert(err.message);
            },
            inputVerificationCode: function (data) {
                $("#statusText").text('Verification code was sent to ' +
                    data.CodeDeliveryDetails.Destination + '. Check your email.');
                $("#loginArea").hide();
                $("#newPwArea").show();
                $("#verificationCodeArea").show();
                needVerificationCode = true;
            }
        });
    });
});