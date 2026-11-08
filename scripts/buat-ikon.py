# Bangun ulang semua ikon (tab, PWA, iOS, Android maskable) dari public/kop/logo-klinik.png.
# Jalankan dari akar proyek: python scripts/buat-ikon.py   (butuh Pillow: pip install pillow)
from PIL import Image
src = Image.open("public/kop/logo-klinik.png").convert("RGBA")
logo = src.crop(src.getbbox())                    # logo utuh (tanda + teks)
tanda = src.crop((97, 30, 415, 335))              # hanya ibu-bayi, tanpa teks
tanda = tanda.crop(tanda.getbbox())

def taruh(gambar, sisi, isi, latar):
    """Gambar diskalakan agar sisi terpanjangnya = isi*sisi, di tengah kanvas."""
    k = Image.new("RGBA", (sisi, sisi), latar)
    s = isi * sisi / max(gambar.size)
    g = gambar.resize((round(gambar.width * s), round(gambar.height * s)), Image.LANCZOS)
    k.alpha_composite(g, ((sisi - g.width) // 2, (sisi - g.height) // 2))
    return k

PUTIH, BENING = (255, 255, 255, 255), (0, 0, 0, 0)
taruh(logo, 192, 0.84, PUTIH).save("public/icons/icon-192x192.png", optimize=True)
taruh(logo, 512, 0.84, PUTIH).save("public/icons/icon-512x512.png", optimize=True)
# maskable: Android memotong ke lingkaran/squircle; isi harus di zona aman (lingkaran 80%)
taruh(logo, 512, 0.64, PUTIH).save("public/icons/maskable-icon-512x512.png", optimize=True)
# iOS menolak transparansi dan membulatkan sudut sendiri
taruh(logo, 180, 0.80, PUTIH).convert("RGB").save("public/icons/apple-touch-icon.png", optimize=True)
# tab browser: hanya tanda, bening, hampir penuh — teks tak terbaca di 16px.
# Tepi putih tipis agar tetap terlihat di bilah tab bertema gelap.
from PIL import ImageFilter
def bertepi(g, tebal):
    k = Image.new("RGBA", (g.width + 2 * tebal, g.height + 2 * tebal), BENING)
    k.alpha_composite(g, (tebal, tebal))
    a = k.split()[3].point(lambda v: 255 if v > 60 else 0).filter(ImageFilter.MaxFilter(2 * tebal + 1)).filter(ImageFilter.GaussianBlur(2.5))
    alas = Image.new("RGBA", k.size, PUTIH); alas.putalpha(a)
    alas.alpha_composite(k)
    return alas
tanda = bertepi(tanda, 14)
taruh(tanda, 192, 0.96, BENING).save("public/icons/icon-tab.png", optimize=True)
taruh(tanda, 256, 0.98, BENING).save("src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("ok")
