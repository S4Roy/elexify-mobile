#!/bin/sh
set -eu

source_plist="${GOOGLE_SERVICE_INFO_PLIST:-$PROJECT_DIR/Elexify/GoogleService-Info.plist}"
destination_dir="$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
destination_plist="$destination_dir/GoogleService-Info.plist"

if [ ! -f "$source_plist" ]; then
  if [ "$CONFIGURATION" = "Release" ]; then
    echo "error: Release builds require the production Firebase plist at ios/Elexify/GoogleService-Info.plist."
    exit 1
  fi
  echo "warning: GoogleService-Info.plist is missing; Firebase push will be unavailable in this build."
  exit 0
fi

bundle_id=$(/usr/libexec/PlistBuddy -c 'Print :BUNDLE_ID' "$source_plist")
if [ "$bundle_id" != "$PRODUCT_BUNDLE_IDENTIFIER" ]; then
  echo "error: Firebase plist bundle ID does not match PRODUCT_BUNDLE_IDENTIFIER."
  exit 1
fi

mkdir -p "$destination_dir"
cp "$source_plist" "$destination_plist"
