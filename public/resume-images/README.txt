What this folder is
-------------------
This is a shelf for pictures on your website, itsjakegray.com.

A picture placed here gets a direct link:

  https://itsjakegray.com/resume-images/your-file-name.jpg

Anyone who has that exact link can open the picture. Google and the Internet Archive are asked not to list or save this shelf. That request is not a lock. The link still works.

The only other file here, ".gitkeep", is an empty placeholder so the shelf exists before any pictures are added. It is not a picture.


What was set up
---------------
The website was already hosted by a company called Vercel. This shelf was added to that same website. A second website was not created.

Three pieces were added:

1. This folder, public/resume-images.
2. A note to search engines, public/robots.txt, telling them to skip this folder.
3. A site setting, vercel.json, that marks every file in this folder "do not index, do not archive, do not quote."

The domain was already pointed at Vercel. The main address record was later changed to the single address Vercel asked for: 76.76.21.21. Email records were not changed.


How a picture gets onto the site
--------------------------------
There is no upload button. You put a file in this folder, save it to the main copy of the project on GitHub, and Vercel publishes the site.

The GitHub project is public. A picture saved there is public in two places: the website link above, and the GitHub project history.


Before any picture goes in this folder
---------------------------------------
Photos from a phone carry hidden details: where it was taken, which phone, the time, and sometimes a name. Those details ride along inside the file. They must be removed before the file is put on the public internet.

Do the first test with a made-up picture, not a real photo.

On a Mac, this makes a small blue square with no hidden details:

  python3 - << 'PY'
  import struct, zlib
  w = h = 32
  raw = b''.join(b'\x00' + bytes([40, 90, 140]) * w for _ in range(h))
  def chunk(tag, data):
      return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
  png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')
  open('/tmp/resume-test.png', 'wb').write(png)
  PY

For a real picture, clean a copy. Do not clean the original.

  brew install exiftool
  cp ~/Desktop/original.jpg /tmp/clean.jpg
  exiftool -all= -overwrite_original /tmp/clean.jpg
  exiftool -a -G1 -s /tmp/clean.jpg

The last command should not show a place, a camera serial number, an owner, or a date the photo was taken. If it does, do not upload that file.

Name the file something plain, such as test.png. Do not use a camera name such as IMG_1234.jpg.


Publish the clean file
----------------------
From the project folder, on the main branch:

  cp /tmp/resume-test.png public/resume-images/test.png
  git add public/resume-images/test.png
  git commit -m "Add a metadata-free resume image test."
  git push origin main

Then open https://itsjakegray.com/resume-images/test.png
The page should show the picture. The response should include this label:

  X-Robots-Tag: noindex, noarchive, nosnippet


Take a picture back down
------------------------
  git rm public/resume-images/test.png
  git commit -m "Remove the resume image test."
  git push origin main

That removes it from the live site and from the latest copy on GitHub. Older saved copies of the project can still contain the file. That is why the test picture must not be a real photo.

To remove this note itself, delete public/resume-images/README.txt the same way.
