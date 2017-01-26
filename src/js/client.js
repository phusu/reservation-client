var WEEKS_TO_FORWARD = 5;
var HOURS_IN_DAY = 24;
var DAYS_IN_WEEK = 7;
var API_ENDPOINT = <<YOUR_API_ENDPOINT_URL>>;
var DATE_FORMATTER = 'YYYY-MM-DDTHH:mm:ss';
var PUT_METHOD = 'PUT';
var DELETE_METHOD = 'DELETE';
var START_HOUR = 8;
var END_HOUR = 24;
var reservations = null;

var cognitoUser = null;
var authorizedUser = null;

$(document).ready(function () {

    if (cognitoUser == null) {
        // Check if credentials exist
        var poolData = {
            UserPoolId: <<YOUR_USER_POOL_ID>>, // Your user pool id here
            ClientId: <<YOUR_CLIENT_ID>> // Your client id here
        };
        var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
        cognitoUser = userPool.getCurrentUser();

        if (cognitoUser != null) {

            cognitoUser.getSession(function (err, session) {
                if (err) {
                    alert(err);
                    return;
                }

                if (!session.isValid()) {
                    // Redirect to login
                    window.location.replace("login.html");
                    return;
                }

                // Fill username
                authorizedUser = cognitoUser.getUsername();
                $("#userNameLabel").text(authorizedUser);

                // Get data from backend
                getDataFromBackEnd(session.getIdToken().getJwtToken());
            });
        }
        else {
            // Redirect to login
            window.location.replace("login.html");
        }
    }

    // Get reservations from backend
    function getDataFromBackEnd(token) {
        $.ajax({
            url: API_ENDPOINT,
            type: 'GET',
            dataType: 'json',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', token);
            },
            success: function (data) {
                renderPage(data);
            }
        });

        function renderPage(data) {
            reservations = data;

            // Populate the calendar area
            var time = moment();
            var timeNow = moment();
            time.startOf('isoWeek');
            timeNow.minute(0);
            timeNow.second(0);
            timeNow.millisecond(0);
            var html = '';
            html += '<div class="table-responsive">';
            for (var i = 0; i < WEEKS_TO_FORWARD; ++i) {
                html += '<span class="weekNumber">Week ' + time.isoWeek() + '</span>';
                html += '<table class="table table-bordered">';

                html += '<tr><th class="headers"></th>';
                for (var j = 0; j < DAYS_IN_WEEK; ++j) {
                    html += '<th class="headers">' + time.format('dddd DD.MM.') + '</th>';
                    time.add(1, 'd');
                }
                html += '</tr>';
                time.subtract(DAYS_IN_WEEK, 'd');
                time.millisecond(0);
                time.minute(0);
                time.second(0);
                time.hour(START_HOUR);

                for (var j = START_HOUR; j < END_HOUR; ++j) {
                    html += '<tr>';
                    html += '<td class="headers">' + j + ' - ' + (j + 1) + '</td>';

                    for (var k = 0; k < DAYS_IN_WEEK; ++k) {
                        if (time.isBefore(timeNow)) {
                            html += '<td class="pastTime"></td>';
                        }
                        else {
                            // Check if this slot is reserved or not
                            var userName = findReservation(time.format(DATE_FORMATTER));
                            if (userName != null) {
                                if (authorizedUser === userName) {
                                    html += '<td class="reserved-own" id="' + time.format(DATE_FORMATTER)
                                     + '">' + userName + ' - Delete';
                                }
                                else {
                                    html += '<td class="reserved" id="' + time.format(DATE_FORMATTER)
                                     + '">' + userName;
                                }
                                html += '</td>';
                            }
                            else {
                                if (isWorkHours(time)) {
                                    html += '<td class="workHours" id="' + time.format(DATE_FORMATTER) + '">Reserve</td>';
                                }
                                else {
                                    html += '<td class="available" id="' + time.format(DATE_FORMATTER) + '">Reserve</td>';
                                }
                                
                            }
                        }

                        time.add(1, 'd');
                    }
                    time.subtract(DAYS_IN_WEEK, 'd');
                    time.add(1, 'h');
                    html += '</tr>';
                }

                time.add(DAYS_IN_WEEK - 1, 'd');

                html += '</table><br>';
            }

            html += '</div>';

            $("#calendarArea").html(html);

            $("td.available").click(function (event) {
                handleReservation(PUT_METHOD, event.target.id);
                event.stopPropagation();
            });

            $("td.reserved-own").click(function (event) {
                handleReservation(DELETE_METHOD, event.target.id);
                event.stopPropagation();
            });
        };

        /**
         * Find and returns username from reservations for given startTime, or null if not found.
         */
        function findReservation(startTime) {
            for (var i = 0; i < reservations.length; ++i) {
                if (reservations[i].startTime != null && reservations[i].startTime === startTime) {
                    return reservations[i].userName;
                }
            }
            return null;
        }
    }

    $("#logOutButton").click(function () {
        if (cognitoUser != null) {
            cognitoUser.signOut();

            window.location.replace("login.html");
        }
    });

});

function isWorkHours(time) {
    if (time.day() > 0 && time.day() < 6 && time.hour() >= 8 && time.hour() < 16) {
        return true;
    }
    return false;
}

function handleReservation(method, startTimeVal) {
    if (cognitoUser != null) {

        cognitoUser.getSession(function (err, session) {
            if (err) {
                alert(err);
                return;
            }

            if (!session.isValid()) {
                // Redirect to login
                console.log("User not found");
                window.location.replace("login.html");
                return;
            }

            var body = {
                startTime: startTimeVal,
                userName: authorizedUser
            };

            $.ajax({
                url: API_ENDPOINT,
                type: method,
                data: JSON.stringify(body),
                dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', session.getIdToken().getJwtToken());
                },
                success: function (data) {
                    window.location.replace("index.html");
                },
                error: function (err) {
                    console.log('Error: ' + JSON.stringify(err));
                }
            });
        });
    }
    else {
        // Redirect to login
        window.location.replace("login.html");
        return;
    }
}
