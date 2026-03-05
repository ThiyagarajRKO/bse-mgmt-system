const fs = require("fs");
const path = require("path");

// Utility function to copy files/directories (with depth limit to prevent infinite recursion)
function copyRecursive(src, dest, maxDepth = 5, currentDepth = 0) {
  // Prevent infinite recursion
  if (currentDepth > maxDepth) {
    console.warn(`⚠️  Max depth (${maxDepth}) reached at: ${src}`);
    return;
  }

  // Skip if source doesn't exist
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  Skipping missing source: ${src}`);
    return;
  }

  try {
    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      const files = fs.readdirSync(src);
      files.forEach((file) => {
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        copyRecursive(srcFile, destFile, maxDepth, currentDepth + 1);
      });
    } else {
      // Ensure destination directory exists
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
    }
  } catch (err) {
    console.warn(`⚠️  Error copying ${src}: ${err.message}`);
  }
}

const nodeModulesPath = path.join(__dirname, "../../node_modules");
const publicPath = path.join(__dirname, "../../public");

// Copy jQuery
console.log("Copying jQuery...");
copyRecursive(
  path.join(nodeModulesPath, "jquery/dist/jquery.min.js"),
  path.join(publicPath, "plugins/jquery/jquery.min.js"),
);

// Copy Select2
console.log("Copying Select2...");
copyRecursive(
  path.join(nodeModulesPath, "select2/dist"),
  path.join(publicPath, "plugins/select2"),
);

// Copy Toastr
console.log("Copying Toastr...");
copyRecursive(
  path.join(nodeModulesPath, "toastr/build"),
  path.join(publicPath, "plugins/Toastr"),
);

// Copy Font Awesome
console.log("Copying Font Awesome...");
copyRecursive(
  path.join(nodeModulesPath, "@fortawesome/fontawesome-free/css"),
  path.join(publicPath, "plugins/font-awesome/css"),
);
copyRecursive(
  path.join(nodeModulesPath, "@fortawesome/fontawesome-free/webfonts"),
  path.join(publicPath, "plugins/font-awesome/webfonts"),
);

console.log("✅ All assets copied successfully!");
