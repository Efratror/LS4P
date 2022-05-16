set -e


fileName='jre'
if [ -d $fileName ] 
then
  rm -rf "$fileName"
fi

curl -L https://github.com/Efratror/Processing-JRE/releases/download/V0.01/processing-jre-v0.01-macos.tar.gz >> $fileName.tar.gz
tar -xf "$PWD/$fileName.tar.gz"
mv "macos" "$fileName"
rm "$fileName.tar.gz"