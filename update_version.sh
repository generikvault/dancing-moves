NEW_VERSION=$1
NEW_VERSION_CODE=$2
OLD_VERSION=`grep -Po '(?<=version": ")[\d\.]+' package.json`
OLD_VERSION_CODE=`grep -Po '(?<=versionCode )[\d]+' android/app/build.gradle`
sed -i "s/$OLD_VERSION/$NEW_VERSION/g" package.json
sed -i "s/$OLD_VERSION/$NEW_VERSION/g" android/app/build.gradle
sed -i "s/$OLD_VERSION_CODE/$NEW_VERSION_CODE/g" android/app/build.gradle

git add package.json android/app/build.gradle
git commit -m "update version $NEW_VERSION"
git tag "$NEW_VERSION"