#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== PROFILE UPDATE TEST SCRIPT ===');

// Test data
const testProfile = {
  "name": "Test User",
  "bio": "This is a test bio to verify profile updates are working.",
  "image": "/pfp.jpg",
  "background": "bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
  "aboutMe": "This is a test about me section to verify that profile updates are working correctly. If you can see this, the update mechanism is functioning properly.",
  "credits": {
    "profilePicture": {
      "url": "https://example.com/test",
      "artist": "Test Artist"
    }
  },
  "socialLinks": [
    {
      "name": "Test Social",
      "url": "https://example.com/test",
      "icon": "Github",
      "color": "hover:text-blue-500 dark:hover:text-blue-400",
      "bgColor": "hover:bg-blue-50 dark:hover:bg-blue-900/20"
    }
  ]
};

// Function to parse profile content
function parseProfileContent(content) {
  // Pattern 1: Look for export const profile = { ... } (with or without semicolon)
  const match1 = content.match(/export const profile = ({[\s\S]*?})(?:;|\s*$)/);
  if (match1) {
    try {
      const profile = eval('(' + match1[1] + ')');
      return { success: true, profile, method: 'pattern1' };
    } catch (evalError) {
      console.error('Pattern 1 eval error:', evalError.message);
    }
  }
  
  // Pattern 2: Look for the object after "export const profile ="
  const exportIndex = content.indexOf('export const profile =');
  if (exportIndex !== -1) {
    const afterExport = content.substring(exportIndex + 'export const profile ='.length);
    
    // Find the closing brace by counting braces
    let braceCount = 0;
    let endIndex = -1;
    for (let i = 0; i < afterExport.length; i++) {
      if (afterExport[i] === '{') braceCount++;
      if (afterExport[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
    if (endIndex !== -1) {
      const profileStr = afterExport.substring(0, endIndex + 1);
      try {
        const profile = eval('(' + profileStr + ')');
        return { success: true, profile, method: 'pattern2' };
      } catch (evalError) {
        console.error('Pattern 2 eval error:', evalError.message);
      }
    }
  }
  
  return { success: false, error: 'Could not parse profile content' };
}

// Function to update profile file
function updateProfileFile() {
  const profileContent = `// Hello, stranger. I like changing my stuff around a lot, so I decided to do future me a favor and make it a separate file that we pull from instead of hardcoding everything.
export const profile = ${JSON.stringify(testProfile, null, 2)}
`;

  // Try both possible locations
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'profile.js'),
    path.join(process.cwd(), 'app', 'profile.js')
  ];

  for (const filePath of possiblePaths) {
    console.log(`\nChecking path: ${filePath}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);
    
    if (fs.existsSync(filePath)) {
      try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created directory: ${dir}`);
        }

        // Write the test profile
        fs.writeFileSync(filePath, profileContent, 'utf8');
        console.log(`✅ Successfully updated profile file: ${filePath}`);
        
        // Verify the write
        const verifyContent = fs.readFileSync(filePath, 'utf8');
        console.log(`Verification - file size: ${verifyContent.length} characters`);
        
        // Try to parse it
        const parseResult = parseProfileContent(verifyContent);
        if (parseResult.success) {
          console.log(`✅ Successfully parsed written profile using ${parseResult.method}`);
          console.log(`Profile name: ${parseResult.profile.name}`);
          console.log(`Profile aboutMe: ${parseResult.profile.aboutMe}`);
        } else {
          console.log(`❌ Could not parse written profile content: ${parseResult.error}`);
        }
        
        return true;
      } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
      }
    }
  }
  
  console.log('❌ No valid profile file found to update');
  return false;
}

// Function to read and display current profile
function readCurrentProfile() {
  console.log('\n=== READING CURRENT PROFILE ===');
  
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'profile.js'),
    path.join(process.cwd(), 'app', 'profile.js')
  ];

  for (const filePath of possiblePaths) {
    console.log(`\nChecking path: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`File size: ${content.length} characters`);
        console.log(`Content preview: ${content.substring(0, 200)}...`);
        
        const parseResult = parseProfileContent(content);
        if (parseResult.success) {
          console.log(`✅ Current profile (parsed with ${parseResult.method}):`);
          console.log(`  Name: ${parseResult.profile.name}`);
          console.log(`  Bio: ${parseResult.profile.bio}`);
          console.log(`  AboutMe: ${parseResult.profile.aboutMe}`);
          return parseResult.profile;
        } else {
          console.log(`❌ Could not parse profile content: ${parseResult.error}`);
        }
      } catch (error) {
        console.error(`❌ Error reading ${filePath}:`, error.message);
      }
    } else {
      console.log(`File does not exist`);
    }
  }
  
  return null;
}

// Main execution
console.log('Current working directory:', process.cwd());
console.log('Node environment:', process.env.NODE_ENV || 'development');

// Read current profile
const currentProfile = readCurrentProfile();

// Update profile
console.log('\n=== UPDATING PROFILE ===');
const updateSuccess = updateProfileFile();

if (updateSuccess) {
  console.log('\n=== VERIFICATION ===');
  const newProfile = readCurrentProfile();
  
  if (newProfile && newProfile.name === testProfile.name) {
    console.log('✅ Profile update verification successful!');
    console.log('You should now see the test profile on your website.');
  } else {
    console.log('❌ Profile update verification failed!');
  }
} else {
  console.log('❌ Profile update failed!');
}

console.log('\n=== TEST COMPLETE ===');
console.log('Check your website to see if the changes are reflected.');
console.log('If not, check the server logs for any errors.'); 