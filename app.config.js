const { execFileSync } = require('child_process');
const fs = require('fs');

module.exports = ({ config }) => {
  // GitHub's Android build workflow replaces the icon assets before Expo prebuild.
  // Re-apply the approved FrankiFlow-Admin-App-Icon-Dark.png here so the launcher
  // uses the exact white / silver / teal / blue artwork that was approved.
  // Only the scale/safe-zone is adjusted; the source artwork is not recoloured.
  if (process.env.GITHUB_ACTIONS === 'true' && process.platform === 'linux') {
    const source = '/tmp/frankiflow-approved-dark.png';
    const background = '/tmp/frankiflow-approved-bg.png';
    const scaled = '/tmp/frankiflow-approved-scaled.png';

    try {
      execFileSync('curl', [
        '-L', '--fail', '--retry', '3',
        'https://drive.google.com/uc?export=download&id=1X-h_fzBVMiWtomia9Em2lW_fJYdOYLFY',
        '-o', source,
      ], { stdio: 'inherit' });

      if (fs.existsSync(source) && fs.statSync(source).size > 100000) {
        // Ubuntu GitHub runners provide ImageMagick as `convert`.
        // The outside background is derived from the same approved image so its
        // navy/blue lighting remains consistent. The exact artwork is then scaled
        // to 80% and centred inside Android's adaptive-icon safe area.
        execFileSync('convert', [source, '-resize', '1024x1024!', '-blur', '0x140', background]);
        execFileSync('convert', [source, '-resize', '80%', scaled]);
        execFileSync('convert', [
          background, scaled, '-gravity', 'center', '-composite',
          'assets/icon.png',
        ]);
        fs.copyFileSync('assets/icon.png', 'assets/adaptive-icon.png');
        console.log('Applied approved FrankiFlow dark icon with exact source colours and Android-safe sizing.');
      }
    } catch (error) {
      console.warn('Could not prepare approved launcher icon; existing repository icon is retained.', error.message);
    }
  }

  return config;
};
