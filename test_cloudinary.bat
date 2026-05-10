@echo off
echo Testing Cloudinary configuration on production...
echo.

curl.exe -s -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWRhMjVhYTg4NTdiY2NkOWE5NDkwNGUiLCJlbWFpbCI6ImFkbWluQGltbW90aXNzLmNvbSIsInJvbGUiOiJhZG1pbiIsImNvbXBhbnlUeXBlIjoicHJvbW90ZXVyIiwiaWF0IjoxNzc4NDE3NzA4LCJleHAiOjE3Nzg1MDQxMDh9.f2YPP9kn3Os0FTWFZtmnnwACoI_3WXF_h2Eq97HsLtc" https://immotisse.onrender.com/cloudinary/sign | findstr "cloudName" > temp_check.txt

set /p RESULT=<temp_check.txt
del temp_check.txt

echo Current config: %RESULT%
echo.
echo Expected: "cloudName":"dpv1axdqn"
echo.

if "%RESULT%"=="  "cloudName":"dpv1axdqn"," (
    echo ✅ SUCCESS: Cloudinary config is correct!
    echo You can now test video uploads on https://immotisse-tksv.vercel.app
) else (
    echo ❌ FAIL: Still using old config
    echo Please update Render environment variables with:
    echo CLOUDINARY_CLOUD_NAME=dpv1axdqn
    echo CLOUDINARY_API_KEY=496569887828513
    echo CLOUDINARY_API_SECRET=leOfSPhBeMBcqDpVDqtk0wOxvGE
)

echo.
pause