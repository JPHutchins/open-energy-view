#!/bin/bash
export FLASK_APP=open_energy_view
export FLASK_ENV=production
export SECRET_KEY=KJY346Rb98YbpHk4m
export JWT_SECRET_KEY=c7akiV27bQT16AMnc
export JWT_BLACKLIST_ENABLED=True
export JWT_TOKEN_LOCATION=cookies
export JWT_ACCESS_COOKIE_PATH=/api/web/
export JWT_REFRESH_COOKIE_PATH=/api/web/token/refresh
export JWT_COOKIE_CSRF_PROTECT=True
export PROD_JWT_COOKIE_SECURE=True
export DEV_JWT_COOKIE_SECURE=False
export PROD_DATABASE_URI=sqlite:///../test/data/energy_history_test.db
export DEV_DATABASE_URI=sqlite:///../test/data/energy_history_test.db
export CLIENT_ID=1bf6ac3889a049309701aeac6dfa4a19
export CLIENT_SECRET=6ef77301307b4b9baba8e6f75b6f43f8
