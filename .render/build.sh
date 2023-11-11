#!/usr/bin/env bash
#set -e
echo "################################################"
echo "# Creating directories"
echo "################################################"

mkdir -p dist/prod
mkdir -p staticfiles

echo ""
echo "################################################"
echo "# Installing Salesforce DX CLI"
echo "################################################"

npm install --location=global sfdx-cli --ignore-scripts

echo ""
echo "################################################"
echo "# Installing Python dependencies"
echo "################################################"

pip install --upgrade pip
pip install --upgrade -r requirements.txt

echo ""
echo "################################################"
echo "# Applying Django database migrations"
echo "################################################"

python manage.py migrate --no-input

echo ""
echo "################################################"
echo "# Installing yarn dependencies"
echo "################################################"

yarn

echo ""
echo "################################################"
echo "# Running yarn prod"
echo "################################################"

yarn prod

echo ""
echo "################################################"
echo "# Collecting Django static resources"
echo "################################################"
python manage.py collectstatic --no-input

