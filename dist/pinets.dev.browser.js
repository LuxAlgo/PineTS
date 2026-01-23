
/* 
 * Copyright (C) 2025 Alaa-eddine KADDOURI
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.PineTSLib = {}));
})(this, (function (exports) { 'use strict';

  // This file was generated. Do not modify manually!
  var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 7, 9, 32, 4, 318, 1, 80, 3, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 68, 8, 2, 0, 3, 0, 2, 3, 2, 4, 2, 0, 15, 1, 83, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 7, 19, 58, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 343, 9, 54, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 330, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 10, 5350, 0, 7, 14, 11465, 27, 2343, 9, 87, 9, 39, 4, 60, 6, 26, 9, 535, 9, 470, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4178, 9, 519, 45, 3, 22, 543, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 245, 1, 2, 9, 726, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];

  // This file was generated. Do not modify manually!
  var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 4, 51, 13, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 8, 70, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 39, 27, 10, 22, 251, 41, 7, 1, 17, 2, 60, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 31, 9, 2, 0, 3, 0, 2, 37, 2, 0, 26, 0, 2, 0, 45, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 200, 32, 32, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 328, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 110, 18, 195, 2637, 96, 16, 1071, 18, 5, 26, 3994, 6, 582, 6842, 29, 1763, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 433, 44, 212, 63, 129, 74, 6, 0, 67, 12, 65, 1, 2, 0, 29, 6135, 9, 1237, 42, 9, 8936, 3, 2, 6, 2, 1, 2, 290, 16, 0, 30, 2, 3, 0, 15, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 30, 7, 5, 262, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 229, 29, 3, 0, 496, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4153, 7, 221, 3, 5761, 15, 7472, 16, 621, 2467, 541, 1507, 4938, 6, 4191];

  // This file was generated. Do not modify manually!
  var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u0897-\u089f\u08ca-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b55-\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3c\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0cf3\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d81-\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ece\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u180f-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1abf-\u1ace\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\u30fb\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua82c\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f\uff65";

  // This file was generated. Do not modify manually!
  var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u0870-\u0887\u0889-\u088e\u08a0-\u08c9\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c5d\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cdd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d04-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u1711\u171f-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4c\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c8a\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7cd\ua7d0\ua7d1\ua7d3\ua7d5-\ua7dc\ua7f2-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab69\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";

  // These are a run-length and offset encoded representation of the
  // >0xffff code points that are a valid part of identifiers. The
  // offset starts at 0x10000, and each pair of numbers represents an
  // offset to the next range, and then a size of the range.

  // Reserved word lists for various dialects of the language

  var reservedWords = {
    3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
    5: "class enum extends super const export import",
    6: "enum",
    strict: "implements interface let package private protected public static yield",
    strictBind: "eval arguments"
  };

  // And the keywords

  var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

  var keywords$1 = {
    5: ecma5AndLessKeywords,
    "5module": ecma5AndLessKeywords + " export import",
    6: ecma5AndLessKeywords + " const class extends export import super"
  };

  var keywordRelationalOperator = /^in(stanceof)?$/;

  // ## Character categories

  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

  // This has a complexity linear to the value of the code. The
  // assumption is that looking up astral identifier characters is
  // rare.
  function isInAstralSet(code, set) {
    var pos = 0x10000;
    for (var i = 0; i < set.length; i += 2) {
      pos += set[i];
      if (pos > code) { return false }
      pos += set[i + 1];
      if (pos >= code) { return true }
    }
    return false
  }

  // Test whether a given character code starts an identifier.

  function isIdentifierStart(code, astral) {
    if (code < 65) { return code === 36 }
    if (code < 91) { return true }
    if (code < 97) { return code === 95 }
    if (code < 123) { return true }
    if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code)) }
    if (astral === false) { return false }
    return isInAstralSet(code, astralIdentifierStartCodes)
  }

  // Test whether a given character is part of an identifier.

  function isIdentifierChar(code, astral) {
    if (code < 48) { return code === 36 }
    if (code < 58) { return true }
    if (code < 65) { return false }
    if (code < 91) { return true }
    if (code < 97) { return code === 95 }
    if (code < 123) { return true }
    if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code)) }
    if (astral === false) { return false }
    return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
  }

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // The `startsExpr` property is used to check if the token ends a
  // `yield` expression. It is set on all token types that either can
  // directly start an expression (like a quotation mark) or can
  // continue an expression (like the body of a string).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var TokenType$1 = function TokenType(label, conf) {
    if ( conf === void 0 ) conf = {};

    this.label = label;
    this.keyword = conf.keyword;
    this.beforeExpr = !!conf.beforeExpr;
    this.startsExpr = !!conf.startsExpr;
    this.isLoop = !!conf.isLoop;
    this.isAssign = !!conf.isAssign;
    this.prefix = !!conf.prefix;
    this.postfix = !!conf.postfix;
    this.binop = conf.binop || null;
    this.updateContext = null;
  };

  function binop(name, prec) {
    return new TokenType$1(name, {beforeExpr: true, binop: prec})
  }
  var beforeExpr = {beforeExpr: true}, startsExpr = {startsExpr: true};

  // Map keyword names to token types.

  var keywords = {};

  // Succinct definitions of keyword token types
  function kw(name, options) {
    if ( options === void 0 ) options = {};

    options.keyword = name;
    return keywords[name] = new TokenType$1(name, options)
  }

  var types$1 = {
    num: new TokenType$1("num", startsExpr),
    regexp: new TokenType$1("regexp", startsExpr),
    string: new TokenType$1("string", startsExpr),
    name: new TokenType$1("name", startsExpr),
    privateId: new TokenType$1("privateId", startsExpr),
    eof: new TokenType$1("eof"),

    // Punctuation token types.
    bracketL: new TokenType$1("[", {beforeExpr: true, startsExpr: true}),
    bracketR: new TokenType$1("]"),
    braceL: new TokenType$1("{", {beforeExpr: true, startsExpr: true}),
    braceR: new TokenType$1("}"),
    parenL: new TokenType$1("(", {beforeExpr: true, startsExpr: true}),
    parenR: new TokenType$1(")"),
    comma: new TokenType$1(",", beforeExpr),
    semi: new TokenType$1(";", beforeExpr),
    colon: new TokenType$1(":", beforeExpr),
    dot: new TokenType$1("."),
    question: new TokenType$1("?", beforeExpr),
    questionDot: new TokenType$1("?."),
    arrow: new TokenType$1("=>", beforeExpr),
    template: new TokenType$1("template"),
    invalidTemplate: new TokenType$1("invalidTemplate"),
    ellipsis: new TokenType$1("...", beforeExpr),
    backQuote: new TokenType$1("`", startsExpr),
    dollarBraceL: new TokenType$1("${", {beforeExpr: true, startsExpr: true}),

    // Operators. These carry several kinds of properties to help the
    // parser use them properly (the presence of these properties is
    // what categorizes them as operators).
    //
    // `binop`, when present, specifies that this operator is a binary
    // operator, and will refer to its precedence.
    //
    // `prefix` and `postfix` mark the operator as a prefix or postfix
    // unary operator.
    //
    // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
    // binary operators with a very low precedence, that should result
    // in AssignmentExpression nodes.

    eq: new TokenType$1("=", {beforeExpr: true, isAssign: true}),
    assign: new TokenType$1("_=", {beforeExpr: true, isAssign: true}),
    incDec: new TokenType$1("++/--", {prefix: true, postfix: true, startsExpr: true}),
    prefix: new TokenType$1("!/~", {beforeExpr: true, prefix: true, startsExpr: true}),
    logicalOR: binop("||", 1),
    logicalAND: binop("&&", 2),
    bitwiseOR: binop("|", 3),
    bitwiseXOR: binop("^", 4),
    bitwiseAND: binop("&", 5),
    equality: binop("==/!=/===/!==", 6),
    relational: binop("</>/<=/>=", 7),
    bitShift: binop("<</>>/>>>", 8),
    plusMin: new TokenType$1("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
    modulo: binop("%", 10),
    star: binop("*", 10),
    slash: binop("/", 10),
    starstar: new TokenType$1("**", {beforeExpr: true}),
    coalesce: binop("??", 1),

    // Keyword token types.
    _break: kw("break"),
    _case: kw("case", beforeExpr),
    _catch: kw("catch"),
    _continue: kw("continue"),
    _debugger: kw("debugger"),
    _default: kw("default", beforeExpr),
    _do: kw("do", {isLoop: true, beforeExpr: true}),
    _else: kw("else", beforeExpr),
    _finally: kw("finally"),
    _for: kw("for", {isLoop: true}),
    _function: kw("function", startsExpr),
    _if: kw("if"),
    _return: kw("return", beforeExpr),
    _switch: kw("switch"),
    _throw: kw("throw", beforeExpr),
    _try: kw("try"),
    _var: kw("var"),
    _const: kw("const"),
    _while: kw("while", {isLoop: true}),
    _with: kw("with"),
    _new: kw("new", {beforeExpr: true, startsExpr: true}),
    _this: kw("this", startsExpr),
    _super: kw("super", startsExpr),
    _class: kw("class", startsExpr),
    _extends: kw("extends", beforeExpr),
    _export: kw("export"),
    _import: kw("import", startsExpr),
    _null: kw("null", startsExpr),
    _true: kw("true", startsExpr),
    _false: kw("false", startsExpr),
    _in: kw("in", {beforeExpr: true, binop: 7}),
    _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
    _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
    _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
    _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
  };

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n?|\n|\u2028|\u2029/;
  var lineBreakG = new RegExp(lineBreak.source, "g");

  function isNewLine(code) {
    return code === 10 || code === 13 || code === 0x2028 || code === 0x2029
  }

  function nextLineBreak(code, from, end) {
    if ( end === void 0 ) end = code.length;

    for (var i = from; i < end; i++) {
      var next = code.charCodeAt(i);
      if (isNewLine(next))
        { return i < end - 1 && next === 13 && code.charCodeAt(i + 1) === 10 ? i + 2 : i + 1 }
    }
    return -1
  }

  var nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

  var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

  var ref = Object.prototype;
  var hasOwnProperty = ref.hasOwnProperty;
  var toString = ref.toString;

  var hasOwn = Object.hasOwn || (function (obj, propName) { return (
    hasOwnProperty.call(obj, propName)
  ); });

  var isArray = Array.isArray || (function (obj) { return (
    toString.call(obj) === "[object Array]"
  ); });

  var regexpCache = Object.create(null);

  function wordsRegexp(words) {
    return regexpCache[words] || (regexpCache[words] = new RegExp("^(?:" + words.replace(/ /g, "|") + ")$"))
  }

  function codePointToString(code) {
    // UTF-16 Decoding
    if (code <= 0xFFFF) { return String.fromCharCode(code) }
    code -= 0x10000;
    return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
  }

  var loneSurrogate = /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;

  // These are used when `options.locations` is on, for the
  // `startLoc` and `endLoc` properties.

  var Position = function Position(line, col) {
    this.line = line;
    this.column = col;
  };

  Position.prototype.offset = function offset (n) {
    return new Position(this.line, this.column + n)
  };

  var SourceLocation = function SourceLocation(p, start, end) {
    this.start = start;
    this.end = end;
    if (p.sourceFile !== null) { this.source = p.sourceFile; }
  };

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  function getLineInfo(input, offset) {
    for (var line = 1, cur = 0;;) {
      var nextBreak = nextLineBreak(input, cur, offset);
      if (nextBreak < 0) { return new Position(line, offset - cur) }
      ++line;
      cur = nextBreak;
    }
  }

  // A second argument must be given to configure the parser process.
  // These options are recognized (only `ecmaVersion` is required):

  var defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must be
    // either 3, 5, 6 (or 2015), 7 (2016), 8 (2017), 9 (2018), 10
    // (2019), 11 (2020), 12 (2021), 13 (2022), 14 (2023), or `"latest"`
    // (the latest version the library supports). This influences
    // support for strict mode, the set of reserved words, and support
    // for new syntax features.
    ecmaVersion: null,
    // `sourceType` indicates the mode the code should be parsed in.
    // Can be either `"script"` or `"module"`. This influences global
    // strict mode and parsing of `import` and `export` declarations.
    sourceType: "script",
    // `onInsertedSemicolon` can be a callback that will be called when
    // a semicolon is automatically inserted. It will be passed the
    // position of the inserted semicolon as an offset, and if
    // `locations` is enabled, it is given the location as a `{line,
    // column}` object as second argument.
    onInsertedSemicolon: null,
    // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
    // trailing commas.
    onTrailingComma: null,
    // By default, reserved words are only enforced if ecmaVersion >= 5.
    // Set `allowReserved` to a boolean value to explicitly turn this on
    // an off. When this option has the value "never", reserved words
    // and keywords can also not be used as property names.
    allowReserved: null,
    // When enabled, a return at the top level is not considered an
    // error.
    allowReturnOutsideFunction: false,
    // When enabled, import/export statements are not constrained to
    // appearing at the top of the program, and an import.meta expression
    // in a script isn't considered an error.
    allowImportExportEverywhere: false,
    // By default, await identifiers are allowed to appear at the top-level scope only if ecmaVersion >= 2022.
    // When enabled, await identifiers are allowed to appear at the top-level scope,
    // but they are still not allowed in non-async functions.
    allowAwaitOutsideFunction: null,
    // When enabled, super identifiers are not constrained to
    // appearing in methods and do not raise an error when they appear elsewhere.
    allowSuperOutsideMethod: null,
    // When enabled, hashbang directive in the beginning of file is
    // allowed and treated as a line comment. Enabled by default when
    // `ecmaVersion` >= 2023.
    allowHashBang: false,
    // By default, the parser will verify that private properties are
    // only used in places where they are valid and have been declared.
    // Set this to false to turn such checks off.
    checkPrivateFields: true,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onToken` option, which will
    // cause Acorn to call that function with object in the same
    // format as tokens returned from `tokenizer().getToken()`. Note
    // that you are not allowed to call the parser from the
    // callback—that will corrupt its internal state.
    onToken: null,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments. Note that you are not allowed to call the
    // parser from the callback—that will corrupt its internal state.
    // When this option has an array as value, objects representing the
    // comments are pushed to it.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `locations` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null,
    // This value, if given, is stored in every node, whether
    // `locations` is on or off.
    directSourceFile: null,
    // When enabled, parenthesized expressions are represented by
    // (non-standard) ParenthesizedExpression nodes
    preserveParens: false
  };

  // Interpret and default an options object

  var warnedAboutEcmaVersion = false;

  function getOptions(opts) {
    var options = {};

    for (var opt in defaultOptions)
      { options[opt] = opts && hasOwn(opts, opt) ? opts[opt] : defaultOptions[opt]; }

    if (options.ecmaVersion === "latest") {
      options.ecmaVersion = 1e8;
    } else if (options.ecmaVersion == null) {
      if (!warnedAboutEcmaVersion && typeof console === "object" && console.warn) {
        warnedAboutEcmaVersion = true;
        console.warn("Since Acorn 8.0.0, options.ecmaVersion is required.\nDefaulting to 2020, but this will stop working in the future.");
      }
      options.ecmaVersion = 11;
    } else if (options.ecmaVersion >= 2015) {
      options.ecmaVersion -= 2009;
    }

    if (options.allowReserved == null)
      { options.allowReserved = options.ecmaVersion < 5; }

    if (!opts || opts.allowHashBang == null)
      { options.allowHashBang = options.ecmaVersion >= 14; }

    if (isArray(options.onToken)) {
      var tokens = options.onToken;
      options.onToken = function (token) { return tokens.push(token); };
    }
    if (isArray(options.onComment))
      { options.onComment = pushComment(options, options.onComment); }

    return options
  }

  function pushComment(options, array) {
    return function(block, text, start, end, startLoc, endLoc) {
      var comment = {
        type: block ? "Block" : "Line",
        value: text,
        start: start,
        end: end
      };
      if (options.locations)
        { comment.loc = new SourceLocation(this, startLoc, endLoc); }
      if (options.ranges)
        { comment.range = [start, end]; }
      array.push(comment);
    }
  }

  // Each scope gets a bitset that may contain these flags
  var
      SCOPE_TOP = 1,
      SCOPE_FUNCTION = 2,
      SCOPE_ASYNC = 4,
      SCOPE_GENERATOR = 8,
      SCOPE_ARROW = 16,
      SCOPE_SIMPLE_CATCH = 32,
      SCOPE_SUPER = 64,
      SCOPE_DIRECT_SUPER = 128,
      SCOPE_CLASS_STATIC_BLOCK = 256,
      SCOPE_CLASS_FIELD_INIT = 512,
      SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK;

  function functionFlags(async, generator) {
    return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0)
  }

  // Used in checkLVal* and declareName to determine the type of a binding
  var
      BIND_NONE = 0, // Not a binding
      BIND_VAR = 1, // Var-style binding
      BIND_LEXICAL = 2, // Let- or const-style binding
      BIND_FUNCTION = 3, // Function declaration
      BIND_SIMPLE_CATCH = 4, // Simple (identifier pattern) catch binding
      BIND_OUTSIDE = 5; // Special case for function names as bound inside the function

  var Parser$1 = function Parser(options, input, startPos) {
    this.options = options = getOptions(options);
    this.sourceFile = options.sourceFile;
    this.keywords = wordsRegexp(keywords$1[options.ecmaVersion >= 6 ? 6 : options.sourceType === "module" ? "5module" : 5]);
    var reserved = "";
    if (options.allowReserved !== true) {
      reserved = reservedWords[options.ecmaVersion >= 6 ? 6 : options.ecmaVersion === 5 ? 5 : 3];
      if (options.sourceType === "module") { reserved += " await"; }
    }
    this.reservedWords = wordsRegexp(reserved);
    var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
    this.reservedWordsStrict = wordsRegexp(reservedStrict);
    this.reservedWordsStrictBind = wordsRegexp(reservedStrict + " " + reservedWords.strictBind);
    this.input = String(input);

    // Used to signal to callers of `readWord1` whether the word
    // contained any escape sequences. This is needed because words with
    // escape sequences must not be interpreted as keywords.
    this.containsEsc = false;

    // Set up token state

    // The current position of the tokenizer in the input.
    if (startPos) {
      this.pos = startPos;
      this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
      this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
    } else {
      this.pos = this.lineStart = 0;
      this.curLine = 1;
    }

    // Properties of the current token:
    // Its type
    this.type = types$1.eof;
    // For tokens that include more information than their type, the value
    this.value = null;
    // Its start and end offset
    this.start = this.end = this.pos;
    // And, if locations are used, the {line, column} object
    // corresponding to those offsets
    this.startLoc = this.endLoc = this.curPosition();

    // Position information for the previous token
    this.lastTokEndLoc = this.lastTokStartLoc = null;
    this.lastTokStart = this.lastTokEnd = this.pos;

    // The context stack is used to superficially track syntactic
    // context to predict whether a regular expression is allowed in a
    // given position.
    this.context = this.initialContext();
    this.exprAllowed = true;

    // Figure out if it's a module code.
    this.inModule = options.sourceType === "module";
    this.strict = this.inModule || this.strictDirective(this.pos);

    // Used to signify the start of a potential arrow function
    this.potentialArrowAt = -1;
    this.potentialArrowInForAwait = false;

    // Positions to delayed-check that yield/await does not exist in default parameters.
    this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
    // Labels in scope.
    this.labels = [];
    // Thus-far undefined exports.
    this.undefinedExports = Object.create(null);

    // If enabled, skip leading hashbang line.
    if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!")
      { this.skipLineComment(2); }

    // Scope tracking for duplicate variable names (see scope.js)
    this.scopeStack = [];
    this.enterScope(SCOPE_TOP);

    // For RegExp validation
    this.regexpState = null;

    // The stack of private names.
    // Each element has two properties: 'declared' and 'used'.
    // When it exited from the outermost class definition, all used private names must be declared.
    this.privateNameStack = [];
  };

  var prototypeAccessors = { inFunction: { configurable: true },inGenerator: { configurable: true },inAsync: { configurable: true },canAwait: { configurable: true },allowSuper: { configurable: true },allowDirectSuper: { configurable: true },treatFunctionsAsVar: { configurable: true },allowNewDotTarget: { configurable: true },inClassStaticBlock: { configurable: true } };

  Parser$1.prototype.parse = function parse () {
    var node = this.options.program || this.startNode();
    this.nextToken();
    return this.parseTopLevel(node)
  };

  prototypeAccessors.inFunction.get = function () { return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0 };

  prototypeAccessors.inGenerator.get = function () { return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0 };

  prototypeAccessors.inAsync.get = function () { return (this.currentVarScope().flags & SCOPE_ASYNC) > 0 };

  prototypeAccessors.canAwait.get = function () {
    for (var i = this.scopeStack.length - 1; i >= 0; i--) {
      var ref = this.scopeStack[i];
        var flags = ref.flags;
      if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT)) { return false }
      if (flags & SCOPE_FUNCTION) { return (flags & SCOPE_ASYNC) > 0 }
    }
    return (this.inModule && this.options.ecmaVersion >= 13) || this.options.allowAwaitOutsideFunction
  };

  prototypeAccessors.allowSuper.get = function () {
    var ref = this.currentThisScope();
      var flags = ref.flags;
    return (flags & SCOPE_SUPER) > 0 || this.options.allowSuperOutsideMethod
  };

  prototypeAccessors.allowDirectSuper.get = function () { return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0 };

  prototypeAccessors.treatFunctionsAsVar.get = function () { return this.treatFunctionsAsVarInScope(this.currentScope()) };

  prototypeAccessors.allowNewDotTarget.get = function () {
    for (var i = this.scopeStack.length - 1; i >= 0; i--) {
      var ref = this.scopeStack[i];
        var flags = ref.flags;
      if (flags & (SCOPE_CLASS_STATIC_BLOCK | SCOPE_CLASS_FIELD_INIT) ||
          ((flags & SCOPE_FUNCTION) && !(flags & SCOPE_ARROW))) { return true }
    }
    return false
  };

  prototypeAccessors.inClassStaticBlock.get = function () {
    return (this.currentVarScope().flags & SCOPE_CLASS_STATIC_BLOCK) > 0
  };

  Parser$1.extend = function extend () {
      var plugins = [], len = arguments.length;
      while ( len-- ) plugins[ len ] = arguments[ len ];

    var cls = this;
    for (var i = 0; i < plugins.length; i++) { cls = plugins[i](cls); }
    return cls
  };

  Parser$1.parse = function parse (input, options) {
    return new this(options, input).parse()
  };

  Parser$1.parseExpressionAt = function parseExpressionAt (input, pos, options) {
    var parser = new this(options, input, pos);
    parser.nextToken();
    return parser.parseExpression()
  };

  Parser$1.tokenizer = function tokenizer (input, options) {
    return new this(options, input)
  };

  Object.defineProperties( Parser$1.prototype, prototypeAccessors );

  var pp$9 = Parser$1.prototype;

  // ## Parser utilities

  var literal = /^(?:'((?:\\[^]|[^'\\])*?)'|"((?:\\[^]|[^"\\])*?)")/;
  pp$9.strictDirective = function(start) {
    if (this.options.ecmaVersion < 5) { return false }
    for (;;) {
      // Try to find string literal.
      skipWhiteSpace.lastIndex = start;
      start += skipWhiteSpace.exec(this.input)[0].length;
      var match = literal.exec(this.input.slice(start));
      if (!match) { return false }
      if ((match[1] || match[2]) === "use strict") {
        skipWhiteSpace.lastIndex = start + match[0].length;
        var spaceAfter = skipWhiteSpace.exec(this.input), end = spaceAfter.index + spaceAfter[0].length;
        var next = this.input.charAt(end);
        return next === ";" || next === "}" ||
          (lineBreak.test(spaceAfter[0]) &&
           !(/[(`.[+\-/*%<>=,?^&]/.test(next) || next === "!" && this.input.charAt(end + 1) === "="))
      }
      start += match[0].length;

      // Skip semicolon, if any.
      skipWhiteSpace.lastIndex = start;
      start += skipWhiteSpace.exec(this.input)[0].length;
      if (this.input[start] === ";")
        { start++; }
    }
  };

  // Predicate that tests whether the next token is of the given
  // type, and if yes, consumes it as a side effect.

  pp$9.eat = function(type) {
    if (this.type === type) {
      this.next();
      return true
    } else {
      return false
    }
  };

  // Tests whether parsed token is a contextual keyword.

  pp$9.isContextual = function(name) {
    return this.type === types$1.name && this.value === name && !this.containsEsc
  };

  // Consumes contextual keyword if possible.

  pp$9.eatContextual = function(name) {
    if (!this.isContextual(name)) { return false }
    this.next();
    return true
  };

  // Asserts that following token is given contextual keyword.

  pp$9.expectContextual = function(name) {
    if (!this.eatContextual(name)) { this.unexpected(); }
  };

  // Test whether a semicolon can be inserted at the current position.

  pp$9.canInsertSemicolon = function() {
    return this.type === types$1.eof ||
      this.type === types$1.braceR ||
      lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
  };

  pp$9.insertSemicolon = function() {
    if (this.canInsertSemicolon()) {
      if (this.options.onInsertedSemicolon)
        { this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc); }
      return true
    }
  };

  // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.

  pp$9.semicolon = function() {
    if (!this.eat(types$1.semi) && !this.insertSemicolon()) { this.unexpected(); }
  };

  pp$9.afterTrailingComma = function(tokType, notNext) {
    if (this.type === tokType) {
      if (this.options.onTrailingComma)
        { this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc); }
      if (!notNext)
        { this.next(); }
      return true
    }
  };

  // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error.

  pp$9.expect = function(type) {
    this.eat(type) || this.unexpected();
  };

  // Raise an unexpected token error.

  pp$9.unexpected = function(pos) {
    this.raise(pos != null ? pos : this.start, "Unexpected token");
  };

  var DestructuringErrors = function DestructuringErrors() {
    this.shorthandAssign =
    this.trailingComma =
    this.parenthesizedAssign =
    this.parenthesizedBind =
    this.doubleProto =
      -1;
  };

  pp$9.checkPatternErrors = function(refDestructuringErrors, isAssign) {
    if (!refDestructuringErrors) { return }
    if (refDestructuringErrors.trailingComma > -1)
      { this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element"); }
    var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
    if (parens > -1) { this.raiseRecoverable(parens, isAssign ? "Assigning to rvalue" : "Parenthesized pattern"); }
  };

  pp$9.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
    if (!refDestructuringErrors) { return false }
    var shorthandAssign = refDestructuringErrors.shorthandAssign;
    var doubleProto = refDestructuringErrors.doubleProto;
    if (!andThrow) { return shorthandAssign >= 0 || doubleProto >= 0 }
    if (shorthandAssign >= 0)
      { this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns"); }
    if (doubleProto >= 0)
      { this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property"); }
  };

  pp$9.checkYieldAwaitInDefaultParams = function() {
    if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
      { this.raise(this.yieldPos, "Yield expression cannot be a default value"); }
    if (this.awaitPos)
      { this.raise(this.awaitPos, "Await expression cannot be a default value"); }
  };

  pp$9.isSimpleAssignTarget = function(expr) {
    if (expr.type === "ParenthesizedExpression")
      { return this.isSimpleAssignTarget(expr.expression) }
    return expr.type === "Identifier" || expr.type === "MemberExpression"
  };

  var pp$8 = Parser$1.prototype;

  // ### Statement parsing

  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.

  pp$8.parseTopLevel = function(node) {
    var exports = Object.create(null);
    if (!node.body) { node.body = []; }
    while (this.type !== types$1.eof) {
      var stmt = this.parseStatement(null, true, exports);
      node.body.push(stmt);
    }
    if (this.inModule)
      { for (var i = 0, list = Object.keys(this.undefinedExports); i < list.length; i += 1)
        {
          var name = list[i];

          this.raiseRecoverable(this.undefinedExports[name].start, ("Export '" + name + "' is not defined"));
        } }
    this.adaptDirectivePrologue(node.body);
    this.next();
    node.sourceType = this.options.sourceType;
    return this.finishNode(node, "Program")
  };

  var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};

  pp$8.isLet = function(context) {
    if (this.options.ecmaVersion < 6 || !this.isContextual("let")) { return false }
    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
    // For ambiguous cases, determine if a LexicalDeclaration (or only a
    // Statement) is allowed here. If context is not empty then only a Statement
    // is allowed. However, `let [` is an explicit negative lookahead for
    // ExpressionStatement, so special-case it first.
    if (nextCh === 91 || nextCh === 92) { return true } // '[', '\'
    if (context) { return false }

    if (nextCh === 123 || nextCh > 0xd7ff && nextCh < 0xdc00) { return true } // '{', astral
    if (isIdentifierStart(nextCh, true)) {
      var pos = next + 1;
      while (isIdentifierChar(nextCh = this.input.charCodeAt(pos), true)) { ++pos; }
      if (nextCh === 92 || nextCh > 0xd7ff && nextCh < 0xdc00) { return true }
      var ident = this.input.slice(next, pos);
      if (!keywordRelationalOperator.test(ident)) { return true }
    }
    return false
  };

  // check 'async [no LineTerminator here] function'
  // - 'async /*foo*/ function' is OK.
  // - 'async /*\n*/ function' is invalid.
  pp$8.isAsyncFunction = function() {
    if (this.options.ecmaVersion < 8 || !this.isContextual("async"))
      { return false }

    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length, after;
    return !lineBreak.test(this.input.slice(this.pos, next)) &&
      this.input.slice(next, next + 8) === "function" &&
      (next + 8 === this.input.length ||
       !(isIdentifierChar(after = this.input.charCodeAt(next + 8)) || after > 0xd7ff && after < 0xdc00))
  };

  pp$8.isUsingKeyword = function(isAwaitUsing, isFor) {
    if (this.options.ecmaVersion < 17 || !this.isContextual(isAwaitUsing ? "await" : "using"))
      { return false }

    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length;

    if (lineBreak.test(this.input.slice(this.pos, next))) { return false }

    if (isAwaitUsing) {
      var awaitEndPos = next + 5 /* await */, after;
      if (this.input.slice(next, awaitEndPos) !== "using" ||
        awaitEndPos === this.input.length ||
        isIdentifierChar(after = this.input.charCodeAt(awaitEndPos)) ||
        (after > 0xd7ff && after < 0xdc00)
      ) { return false }

      skipWhiteSpace.lastIndex = awaitEndPos;
      var skipAfterUsing = skipWhiteSpace.exec(this.input);
      if (skipAfterUsing && lineBreak.test(this.input.slice(awaitEndPos, awaitEndPos + skipAfterUsing[0].length))) { return false }
    }

    if (isFor) {
      var ofEndPos = next + 2 /* of */, after$1;
      if (this.input.slice(next, ofEndPos) === "of") {
        if (ofEndPos === this.input.length ||
          (!isIdentifierChar(after$1 = this.input.charCodeAt(ofEndPos)) && !(after$1 > 0xd7ff && after$1 < 0xdc00))) { return false }
      }
    }

    var ch = this.input.charCodeAt(next);
    return isIdentifierStart(ch, true) || ch === 92 // '\'
  };

  pp$8.isAwaitUsing = function(isFor) {
    return this.isUsingKeyword(true, isFor)
  };

  pp$8.isUsing = function(isFor) {
    return this.isUsingKeyword(false, isFor)
  };

  // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo)`, where looking at the previous token
  // does not help.

  pp$8.parseStatement = function(context, topLevel, exports) {
    var starttype = this.type, node = this.startNode(), kind;

    if (this.isLet(context)) {
      starttype = types$1._var;
      kind = "let";
    }

    // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
    case types$1._break: case types$1._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
    case types$1._debugger: return this.parseDebuggerStatement(node)
    case types$1._do: return this.parseDoStatement(node)
    case types$1._for: return this.parseForStatement(node)
    case types$1._function:
      // Function as sole body of either an if statement or a labeled statement
      // works, but not when it is part of a labeled statement that is the sole
      // body of an if statement.
      if ((context && (this.strict || context !== "if" && context !== "label")) && this.options.ecmaVersion >= 6) { this.unexpected(); }
      return this.parseFunctionStatement(node, false, !context)
    case types$1._class:
      if (context) { this.unexpected(); }
      return this.parseClass(node, true)
    case types$1._if: return this.parseIfStatement(node)
    case types$1._return: return this.parseReturnStatement(node)
    case types$1._switch: return this.parseSwitchStatement(node)
    case types$1._throw: return this.parseThrowStatement(node)
    case types$1._try: return this.parseTryStatement(node)
    case types$1._const: case types$1._var:
      kind = kind || this.value;
      if (context && kind !== "var") { this.unexpected(); }
      return this.parseVarStatement(node, kind)
    case types$1._while: return this.parseWhileStatement(node)
    case types$1._with: return this.parseWithStatement(node)
    case types$1.braceL: return this.parseBlock(true, node)
    case types$1.semi: return this.parseEmptyStatement(node)
    case types$1._export:
    case types$1._import:
      if (this.options.ecmaVersion > 10 && starttype === types$1._import) {
        skipWhiteSpace.lastIndex = this.pos;
        var skip = skipWhiteSpace.exec(this.input);
        var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
        if (nextCh === 40 || nextCh === 46) // '(' or '.'
          { return this.parseExpressionStatement(node, this.parseExpression()) }
      }

      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel)
          { this.raise(this.start, "'import' and 'export' may only appear at the top level"); }
        if (!this.inModule)
          { this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'"); }
      }
      return starttype === types$1._import ? this.parseImport(node) : this.parseExport(node, exports)

      // If the statement does not start with a statement keyword or a
      // brace, it's an ExpressionStatement or LabeledStatement. We
      // simply start parsing an expression, and afterwards, if the
      // next token is a colon and the expression was a simple
      // Identifier node, we switch to interpreting it as a label.
    default:
      if (this.isAsyncFunction()) {
        if (context) { this.unexpected(); }
        this.next();
        return this.parseFunctionStatement(node, true, !context)
      }

      var usingKind = this.isAwaitUsing(false) ? "await using" : this.isUsing(false) ? "using" : null;
      if (usingKind) {
        if (topLevel && this.options.sourceType === "script") {
          this.raise(this.start, "Using declaration cannot appear in the top level when source type is `script`");
        }
        if (usingKind === "await using") {
          if (!this.canAwait) {
            this.raise(this.start, "Await using cannot appear outside of async function");
          }
          this.next();
        }
        this.next();
        this.parseVar(node, false, usingKind);
        this.semicolon();
        return this.finishNode(node, "VariableDeclaration")
      }

      var maybeName = this.value, expr = this.parseExpression();
      if (starttype === types$1.name && expr.type === "Identifier" && this.eat(types$1.colon))
        { return this.parseLabeledStatement(node, maybeName, expr, context) }
      else { return this.parseExpressionStatement(node, expr) }
    }
  };

  pp$8.parseBreakContinueStatement = function(node, keyword) {
    var isBreak = keyword === "break";
    this.next();
    if (this.eat(types$1.semi) || this.insertSemicolon()) { node.label = null; }
    else if (this.type !== types$1.name) { this.unexpected(); }
    else {
      node.label = this.parseIdent();
      this.semicolon();
    }

    // Verify that there is an actual destination to break or
    // continue to.
    var i = 0;
    for (; i < this.labels.length; ++i) {
      var lab = this.labels[i];
      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === "loop")) { break }
        if (node.label && isBreak) { break }
      }
    }
    if (i === this.labels.length) { this.raise(node.start, "Unsyntactic " + keyword); }
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
  };

  pp$8.parseDebuggerStatement = function(node) {
    this.next();
    this.semicolon();
    return this.finishNode(node, "DebuggerStatement")
  };

  pp$8.parseDoStatement = function(node) {
    this.next();
    this.labels.push(loopLabel);
    node.body = this.parseStatement("do");
    this.labels.pop();
    this.expect(types$1._while);
    node.test = this.parseParenExpression();
    if (this.options.ecmaVersion >= 6)
      { this.eat(types$1.semi); }
    else
      { this.semicolon(); }
    return this.finishNode(node, "DoWhileStatement")
  };

  // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
  // loop is non-trivial. Basically, we have to parse the init `var`
  // statement or expression, disallowing the `in` operator (see
  // the second parameter to `parseExpression`), and then check
  // whether the next token is `in` or `of`. When there is no init
  // part (semicolon immediately after the opening parenthesis), it
  // is a regular `for` loop.

  pp$8.parseForStatement = function(node) {
    this.next();
    var awaitAt = (this.options.ecmaVersion >= 9 && this.canAwait && this.eatContextual("await")) ? this.lastTokStart : -1;
    this.labels.push(loopLabel);
    this.enterScope(0);
    this.expect(types$1.parenL);
    if (this.type === types$1.semi) {
      if (awaitAt > -1) { this.unexpected(awaitAt); }
      return this.parseFor(node, null)
    }
    var isLet = this.isLet();
    if (this.type === types$1._var || this.type === types$1._const || isLet) {
      var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
      this.next();
      this.parseVar(init$1, true, kind);
      this.finishNode(init$1, "VariableDeclaration");
      return this.parseForAfterInit(node, init$1, awaitAt)
    }
    var startsWithLet = this.isContextual("let"), isForOf = false;

    var usingKind = this.isUsing(true) ? "using" : this.isAwaitUsing(true) ? "await using" : null;
    if (usingKind) {
      var init$2 = this.startNode();
      this.next();
      if (usingKind === "await using") { this.next(); }
      this.parseVar(init$2, true, usingKind);
      this.finishNode(init$2, "VariableDeclaration");
      return this.parseForAfterInit(node, init$2, awaitAt)
    }
    var containsEsc = this.containsEsc;
    var refDestructuringErrors = new DestructuringErrors;
    var initPos = this.start;
    var init = awaitAt > -1
      ? this.parseExprSubscripts(refDestructuringErrors, "await")
      : this.parseExpression(true, refDestructuringErrors);
    if (this.type === types$1._in || (isForOf = this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      if (awaitAt > -1) { // implies `ecmaVersion >= 9` (see declaration of awaitAt)
        if (this.type === types$1._in) { this.unexpected(awaitAt); }
        node.await = true;
      } else if (isForOf && this.options.ecmaVersion >= 8) {
        if (init.start === initPos && !containsEsc && init.type === "Identifier" && init.name === "async") { this.unexpected(); }
        else if (this.options.ecmaVersion >= 9) { node.await = false; }
      }
      if (startsWithLet && isForOf) { this.raise(init.start, "The left-hand side of a for-of loop may not start with 'let'."); }
      this.toAssignable(init, false, refDestructuringErrors);
      this.checkLValPattern(init);
      return this.parseForIn(node, init)
    } else {
      this.checkExpressionErrors(refDestructuringErrors, true);
    }
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, init)
  };

  // Helper method to parse for loop after variable initialization
  pp$8.parseForAfterInit = function(node, init, awaitAt) {
    if ((this.type === types$1._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init.declarations.length === 1) {
      if (this.options.ecmaVersion >= 9) {
        if (this.type === types$1._in) {
          if (awaitAt > -1) { this.unexpected(awaitAt); }
        } else { node.await = awaitAt > -1; }
      }
      return this.parseForIn(node, init)
    }
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, init)
  };

  pp$8.parseFunctionStatement = function(node, isAsync, declarationPosition) {
    this.next();
    return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync)
  };

  pp$8.parseIfStatement = function(node) {
    this.next();
    node.test = this.parseParenExpression();
    // allow function declarations in branches, but only in non-strict mode
    node.consequent = this.parseStatement("if");
    node.alternate = this.eat(types$1._else) ? this.parseStatement("if") : null;
    return this.finishNode(node, "IfStatement")
  };

  pp$8.parseReturnStatement = function(node) {
    if (!this.inFunction && !this.options.allowReturnOutsideFunction)
      { this.raise(this.start, "'return' outside of function"); }
    this.next();

    // In `return` (and `break`/`continue`), the keywords with
    // optional arguments, we eagerly look for a semicolon or the
    // possibility to insert one.

    if (this.eat(types$1.semi) || this.insertSemicolon()) { node.argument = null; }
    else { node.argument = this.parseExpression(); this.semicolon(); }
    return this.finishNode(node, "ReturnStatement")
  };

  pp$8.parseSwitchStatement = function(node) {
    this.next();
    node.discriminant = this.parseParenExpression();
    node.cases = [];
    this.expect(types$1.braceL);
    this.labels.push(switchLabel);
    this.enterScope(0);

    // Statements under must be grouped (by label) in SwitchCase
    // nodes. `cur` is used to keep the node that we are currently
    // adding statements to.

    var cur;
    for (var sawDefault = false; this.type !== types$1.braceR;) {
      if (this.type === types$1._case || this.type === types$1._default) {
        var isCase = this.type === types$1._case;
        if (cur) { this.finishNode(cur, "SwitchCase"); }
        node.cases.push(cur = this.startNode());
        cur.consequent = [];
        this.next();
        if (isCase) {
          cur.test = this.parseExpression();
        } else {
          if (sawDefault) { this.raiseRecoverable(this.lastTokStart, "Multiple default clauses"); }
          sawDefault = true;
          cur.test = null;
        }
        this.expect(types$1.colon);
      } else {
        if (!cur) { this.unexpected(); }
        cur.consequent.push(this.parseStatement(null));
      }
    }
    this.exitScope();
    if (cur) { this.finishNode(cur, "SwitchCase"); }
    this.next(); // Closing brace
    this.labels.pop();
    return this.finishNode(node, "SwitchStatement")
  };

  pp$8.parseThrowStatement = function(node) {
    this.next();
    if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
      { this.raise(this.lastTokEnd, "Illegal newline after throw"); }
    node.argument = this.parseExpression();
    this.semicolon();
    return this.finishNode(node, "ThrowStatement")
  };

  // Reused empty array added for node fields that are always empty.

  var empty$1 = [];

  pp$8.parseCatchClauseParam = function() {
    var param = this.parseBindingAtom();
    var simple = param.type === "Identifier";
    this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
    this.checkLValPattern(param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
    this.expect(types$1.parenR);

    return param
  };

  pp$8.parseTryStatement = function(node) {
    this.next();
    node.block = this.parseBlock();
    node.handler = null;
    if (this.type === types$1._catch) {
      var clause = this.startNode();
      this.next();
      if (this.eat(types$1.parenL)) {
        clause.param = this.parseCatchClauseParam();
      } else {
        if (this.options.ecmaVersion < 10) { this.unexpected(); }
        clause.param = null;
        this.enterScope(0);
      }
      clause.body = this.parseBlock(false);
      this.exitScope();
      node.handler = this.finishNode(clause, "CatchClause");
    }
    node.finalizer = this.eat(types$1._finally) ? this.parseBlock() : null;
    if (!node.handler && !node.finalizer)
      { this.raise(node.start, "Missing catch or finally clause"); }
    return this.finishNode(node, "TryStatement")
  };

  pp$8.parseVarStatement = function(node, kind, allowMissingInitializer) {
    this.next();
    this.parseVar(node, false, kind, allowMissingInitializer);
    this.semicolon();
    return this.finishNode(node, "VariableDeclaration")
  };

  pp$8.parseWhileStatement = function(node) {
    this.next();
    node.test = this.parseParenExpression();
    this.labels.push(loopLabel);
    node.body = this.parseStatement("while");
    this.labels.pop();
    return this.finishNode(node, "WhileStatement")
  };

  pp$8.parseWithStatement = function(node) {
    if (this.strict) { this.raise(this.start, "'with' in strict mode"); }
    this.next();
    node.object = this.parseParenExpression();
    node.body = this.parseStatement("with");
    return this.finishNode(node, "WithStatement")
  };

  pp$8.parseEmptyStatement = function(node) {
    this.next();
    return this.finishNode(node, "EmptyStatement")
  };

  pp$8.parseLabeledStatement = function(node, maybeName, expr, context) {
    for (var i$1 = 0, list = this.labels; i$1 < list.length; i$1 += 1)
      {
      var label = list[i$1];

      if (label.name === maybeName)
        { this.raise(expr.start, "Label '" + maybeName + "' is already declared");
    } }
    var kind = this.type.isLoop ? "loop" : this.type === types$1._switch ? "switch" : null;
    for (var i = this.labels.length - 1; i >= 0; i--) {
      var label$1 = this.labels[i];
      if (label$1.statementStart === node.start) {
        // Update information about previous labels on this node
        label$1.statementStart = this.start;
        label$1.kind = kind;
      } else { break }
    }
    this.labels.push({name: maybeName, kind: kind, statementStart: this.start});
    node.body = this.parseStatement(context ? context.indexOf("label") === -1 ? context + "label" : context : "label");
    this.labels.pop();
    node.label = expr;
    return this.finishNode(node, "LabeledStatement")
  };

  pp$8.parseExpressionStatement = function(node, expr) {
    node.expression = expr;
    this.semicolon();
    return this.finishNode(node, "ExpressionStatement")
  };

  // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).

  pp$8.parseBlock = function(createNewLexicalScope, node, exitStrict) {
    if ( createNewLexicalScope === void 0 ) createNewLexicalScope = true;
    if ( node === void 0 ) node = this.startNode();

    node.body = [];
    this.expect(types$1.braceL);
    if (createNewLexicalScope) { this.enterScope(0); }
    while (this.type !== types$1.braceR) {
      var stmt = this.parseStatement(null);
      node.body.push(stmt);
    }
    if (exitStrict) { this.strict = false; }
    this.next();
    if (createNewLexicalScope) { this.exitScope(); }
    return this.finishNode(node, "BlockStatement")
  };

  // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.

  pp$8.parseFor = function(node, init) {
    node.init = init;
    this.expect(types$1.semi);
    node.test = this.type === types$1.semi ? null : this.parseExpression();
    this.expect(types$1.semi);
    node.update = this.type === types$1.parenR ? null : this.parseExpression();
    this.expect(types$1.parenR);
    node.body = this.parseStatement("for");
    this.exitScope();
    this.labels.pop();
    return this.finishNode(node, "ForStatement")
  };

  // Parse a `for`/`in` and `for`/`of` loop, which are almost
  // same from parser's perspective.

  pp$8.parseForIn = function(node, init) {
    var isForIn = this.type === types$1._in;
    this.next();

    if (
      init.type === "VariableDeclaration" &&
      init.declarations[0].init != null &&
      (
        !isForIn ||
        this.options.ecmaVersion < 8 ||
        this.strict ||
        init.kind !== "var" ||
        init.declarations[0].id.type !== "Identifier"
      )
    ) {
      this.raise(
        init.start,
        ((isForIn ? "for-in" : "for-of") + " loop variable declaration may not have an initializer")
      );
    }
    node.left = init;
    node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();
    this.expect(types$1.parenR);
    node.body = this.parseStatement("for");
    this.exitScope();
    this.labels.pop();
    return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement")
  };

  // Parse a list of variable declarations.

  pp$8.parseVar = function(node, isFor, kind, allowMissingInitializer) {
    node.declarations = [];
    node.kind = kind;
    for (;;) {
      var decl = this.startNode();
      this.parseVarId(decl, kind);
      if (this.eat(types$1.eq)) {
        decl.init = this.parseMaybeAssign(isFor);
      } else if (!allowMissingInitializer && kind === "const" && !(this.type === types$1._in || (this.options.ecmaVersion >= 6 && this.isContextual("of")))) {
        this.unexpected();
      } else if (!allowMissingInitializer && (kind === "using" || kind === "await using") && this.options.ecmaVersion >= 17 && this.type !== types$1._in && !this.isContextual("of")) {
        this.raise(this.lastTokEnd, ("Missing initializer in " + kind + " declaration"));
      } else if (!allowMissingInitializer && decl.id.type !== "Identifier" && !(isFor && (this.type === types$1._in || this.isContextual("of")))) {
        this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
      } else {
        decl.init = null;
      }
      node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
      if (!this.eat(types$1.comma)) { break }
    }
    return node
  };

  pp$8.parseVarId = function(decl, kind) {
    decl.id = kind === "using" || kind === "await using"
      ? this.parseIdent()
      : this.parseBindingAtom();

    this.checkLValPattern(decl.id, kind === "var" ? BIND_VAR : BIND_LEXICAL, false);
  };

  var FUNC_STATEMENT = 1, FUNC_HANGING_STATEMENT = 2, FUNC_NULLABLE_ID = 4;

  // Parse a function declaration or literal (depending on the
  // `statement & FUNC_STATEMENT`).

  // Remove `allowExpressionBody` for 7.0.0, as it is only called with false
  pp$8.parseFunction = function(node, statement, allowExpressionBody, isAsync, forInit) {
    this.initFunction(node);
    if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync) {
      if (this.type === types$1.star && (statement & FUNC_HANGING_STATEMENT))
        { this.unexpected(); }
      node.generator = this.eat(types$1.star);
    }
    if (this.options.ecmaVersion >= 8)
      { node.async = !!isAsync; }

    if (statement & FUNC_STATEMENT) {
      node.id = (statement & FUNC_NULLABLE_ID) && this.type !== types$1.name ? null : this.parseIdent();
      if (node.id && !(statement & FUNC_HANGING_STATEMENT))
        // If it is a regular function declaration in sloppy mode, then it is
        // subject to Annex B semantics (BIND_FUNCTION). Otherwise, the binding
        // mode depends on properties of the current scope (see
        // treatFunctionsAsVar).
        { this.checkLValSimple(node.id, (this.strict || node.generator || node.async) ? this.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION); }
    }

    var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    this.enterScope(functionFlags(node.async, node.generator));

    if (!(statement & FUNC_STATEMENT))
      { node.id = this.type === types$1.name ? this.parseIdent() : null; }

    this.parseFunctionParams(node);
    this.parseFunctionBody(node, allowExpressionBody, false, forInit);

    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, (statement & FUNC_STATEMENT) ? "FunctionDeclaration" : "FunctionExpression")
  };

  pp$8.parseFunctionParams = function(node) {
    this.expect(types$1.parenL);
    node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
    this.checkYieldAwaitInDefaultParams();
  };

  // Parse a class declaration or literal (depending on the
  // `isStatement` parameter).

  pp$8.parseClass = function(node, isStatement) {
    this.next();

    // ecma-262 14.6 Class Definitions
    // A class definition is always strict mode code.
    var oldStrict = this.strict;
    this.strict = true;

    this.parseClassId(node, isStatement);
    this.parseClassSuper(node);
    var privateNameMap = this.enterClassBody();
    var classBody = this.startNode();
    var hadConstructor = false;
    classBody.body = [];
    this.expect(types$1.braceL);
    while (this.type !== types$1.braceR) {
      var element = this.parseClassElement(node.superClass !== null);
      if (element) {
        classBody.body.push(element);
        if (element.type === "MethodDefinition" && element.kind === "constructor") {
          if (hadConstructor) { this.raiseRecoverable(element.start, "Duplicate constructor in the same class"); }
          hadConstructor = true;
        } else if (element.key && element.key.type === "PrivateIdentifier" && isPrivateNameConflicted(privateNameMap, element)) {
          this.raiseRecoverable(element.key.start, ("Identifier '#" + (element.key.name) + "' has already been declared"));
        }
      }
    }
    this.strict = oldStrict;
    this.next();
    node.body = this.finishNode(classBody, "ClassBody");
    this.exitClassBody();
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
  };

  pp$8.parseClassElement = function(constructorAllowsSuper) {
    if (this.eat(types$1.semi)) { return null }

    var ecmaVersion = this.options.ecmaVersion;
    var node = this.startNode();
    var keyName = "";
    var isGenerator = false;
    var isAsync = false;
    var kind = "method";
    var isStatic = false;

    if (this.eatContextual("static")) {
      // Parse static init block
      if (ecmaVersion >= 13 && this.eat(types$1.braceL)) {
        this.parseClassStaticBlock(node);
        return node
      }
      if (this.isClassElementNameStart() || this.type === types$1.star) {
        isStatic = true;
      } else {
        keyName = "static";
      }
    }
    node.static = isStatic;
    if (!keyName && ecmaVersion >= 8 && this.eatContextual("async")) {
      if ((this.isClassElementNameStart() || this.type === types$1.star) && !this.canInsertSemicolon()) {
        isAsync = true;
      } else {
        keyName = "async";
      }
    }
    if (!keyName && (ecmaVersion >= 9 || !isAsync) && this.eat(types$1.star)) {
      isGenerator = true;
    }
    if (!keyName && !isAsync && !isGenerator) {
      var lastValue = this.value;
      if (this.eatContextual("get") || this.eatContextual("set")) {
        if (this.isClassElementNameStart()) {
          kind = lastValue;
        } else {
          keyName = lastValue;
        }
      }
    }

    // Parse element name
    if (keyName) {
      // 'async', 'get', 'set', or 'static' were not a keyword contextually.
      // The last token is any of those. Make it the element name.
      node.computed = false;
      node.key = this.startNodeAt(this.lastTokStart, this.lastTokStartLoc);
      node.key.name = keyName;
      this.finishNode(node.key, "Identifier");
    } else {
      this.parseClassElementName(node);
    }

    // Parse element value
    if (ecmaVersion < 13 || this.type === types$1.parenL || kind !== "method" || isGenerator || isAsync) {
      var isConstructor = !node.static && checkKeyName(node, "constructor");
      var allowsDirectSuper = isConstructor && constructorAllowsSuper;
      // Couldn't move this check into the 'parseClassMethod' method for backward compatibility.
      if (isConstructor && kind !== "method") { this.raise(node.key.start, "Constructor can't have get/set modifier"); }
      node.kind = isConstructor ? "constructor" : kind;
      this.parseClassMethod(node, isGenerator, isAsync, allowsDirectSuper);
    } else {
      this.parseClassField(node);
    }

    return node
  };

  pp$8.isClassElementNameStart = function() {
    return (
      this.type === types$1.name ||
      this.type === types$1.privateId ||
      this.type === types$1.num ||
      this.type === types$1.string ||
      this.type === types$1.bracketL ||
      this.type.keyword
    )
  };

  pp$8.parseClassElementName = function(element) {
    if (this.type === types$1.privateId) {
      if (this.value === "constructor") {
        this.raise(this.start, "Classes can't have an element named '#constructor'");
      }
      element.computed = false;
      element.key = this.parsePrivateIdent();
    } else {
      this.parsePropertyName(element);
    }
  };

  pp$8.parseClassMethod = function(method, isGenerator, isAsync, allowsDirectSuper) {
    // Check key and flags
    var key = method.key;
    if (method.kind === "constructor") {
      if (isGenerator) { this.raise(key.start, "Constructor can't be a generator"); }
      if (isAsync) { this.raise(key.start, "Constructor can't be an async method"); }
    } else if (method.static && checkKeyName(method, "prototype")) {
      this.raise(key.start, "Classes may not have a static property named prototype");
    }

    // Parse value
    var value = method.value = this.parseMethod(isGenerator, isAsync, allowsDirectSuper);

    // Check value
    if (method.kind === "get" && value.params.length !== 0)
      { this.raiseRecoverable(value.start, "getter should have no params"); }
    if (method.kind === "set" && value.params.length !== 1)
      { this.raiseRecoverable(value.start, "setter should have exactly one param"); }
    if (method.kind === "set" && value.params[0].type === "RestElement")
      { this.raiseRecoverable(value.params[0].start, "Setter cannot use rest params"); }

    return this.finishNode(method, "MethodDefinition")
  };

  pp$8.parseClassField = function(field) {
    if (checkKeyName(field, "constructor")) {
      this.raise(field.key.start, "Classes can't have a field named 'constructor'");
    } else if (field.static && checkKeyName(field, "prototype")) {
      this.raise(field.key.start, "Classes can't have a static field named 'prototype'");
    }

    if (this.eat(types$1.eq)) {
      // To raise SyntaxError if 'arguments' exists in the initializer.
      this.enterScope(SCOPE_CLASS_FIELD_INIT | SCOPE_SUPER);
      field.value = this.parseMaybeAssign();
      this.exitScope();
    } else {
      field.value = null;
    }
    this.semicolon();

    return this.finishNode(field, "PropertyDefinition")
  };

  pp$8.parseClassStaticBlock = function(node) {
    node.body = [];

    var oldLabels = this.labels;
    this.labels = [];
    this.enterScope(SCOPE_CLASS_STATIC_BLOCK | SCOPE_SUPER);
    while (this.type !== types$1.braceR) {
      var stmt = this.parseStatement(null);
      node.body.push(stmt);
    }
    this.next();
    this.exitScope();
    this.labels = oldLabels;

    return this.finishNode(node, "StaticBlock")
  };

  pp$8.parseClassId = function(node, isStatement) {
    if (this.type === types$1.name) {
      node.id = this.parseIdent();
      if (isStatement)
        { this.checkLValSimple(node.id, BIND_LEXICAL, false); }
    } else {
      if (isStatement === true)
        { this.unexpected(); }
      node.id = null;
    }
  };

  pp$8.parseClassSuper = function(node) {
    node.superClass = this.eat(types$1._extends) ? this.parseExprSubscripts(null, false) : null;
  };

  pp$8.enterClassBody = function() {
    var element = {declared: Object.create(null), used: []};
    this.privateNameStack.push(element);
    return element.declared
  };

  pp$8.exitClassBody = function() {
    var ref = this.privateNameStack.pop();
    var declared = ref.declared;
    var used = ref.used;
    if (!this.options.checkPrivateFields) { return }
    var len = this.privateNameStack.length;
    var parent = len === 0 ? null : this.privateNameStack[len - 1];
    for (var i = 0; i < used.length; ++i) {
      var id = used[i];
      if (!hasOwn(declared, id.name)) {
        if (parent) {
          parent.used.push(id);
        } else {
          this.raiseRecoverable(id.start, ("Private field '#" + (id.name) + "' must be declared in an enclosing class"));
        }
      }
    }
  };

  function isPrivateNameConflicted(privateNameMap, element) {
    var name = element.key.name;
    var curr = privateNameMap[name];

    var next = "true";
    if (element.type === "MethodDefinition" && (element.kind === "get" || element.kind === "set")) {
      next = (element.static ? "s" : "i") + element.kind;
    }

    // `class { get #a(){}; static set #a(_){} }` is also conflict.
    if (
      curr === "iget" && next === "iset" ||
      curr === "iset" && next === "iget" ||
      curr === "sget" && next === "sset" ||
      curr === "sset" && next === "sget"
    ) {
      privateNameMap[name] = "true";
      return false
    } else if (!curr) {
      privateNameMap[name] = next;
      return false
    } else {
      return true
    }
  }

  function checkKeyName(node, name) {
    var computed = node.computed;
    var key = node.key;
    return !computed && (
      key.type === "Identifier" && key.name === name ||
      key.type === "Literal" && key.value === name
    )
  }

  // Parses module export declaration.

  pp$8.parseExportAllDeclaration = function(node, exports) {
    if (this.options.ecmaVersion >= 11) {
      if (this.eatContextual("as")) {
        node.exported = this.parseModuleExportName();
        this.checkExport(exports, node.exported, this.lastTokStart);
      } else {
        node.exported = null;
      }
    }
    this.expectContextual("from");
    if (this.type !== types$1.string) { this.unexpected(); }
    node.source = this.parseExprAtom();
    if (this.options.ecmaVersion >= 16)
      { node.attributes = this.parseWithClause(); }
    this.semicolon();
    return this.finishNode(node, "ExportAllDeclaration")
  };

  pp$8.parseExport = function(node, exports) {
    this.next();
    // export * from '...'
    if (this.eat(types$1.star)) {
      return this.parseExportAllDeclaration(node, exports)
    }
    if (this.eat(types$1._default)) { // export default ...
      this.checkExport(exports, "default", this.lastTokStart);
      node.declaration = this.parseExportDefaultDeclaration();
      return this.finishNode(node, "ExportDefaultDeclaration")
    }
    // export var|const|let|function|class ...
    if (this.shouldParseExportStatement()) {
      node.declaration = this.parseExportDeclaration(node);
      if (node.declaration.type === "VariableDeclaration")
        { this.checkVariableExport(exports, node.declaration.declarations); }
      else
        { this.checkExport(exports, node.declaration.id, node.declaration.id.start); }
      node.specifiers = [];
      node.source = null;
      if (this.options.ecmaVersion >= 16)
        { node.attributes = []; }
    } else { // export { x, y as z } [from '...']
      node.declaration = null;
      node.specifiers = this.parseExportSpecifiers(exports);
      if (this.eatContextual("from")) {
        if (this.type !== types$1.string) { this.unexpected(); }
        node.source = this.parseExprAtom();
        if (this.options.ecmaVersion >= 16)
          { node.attributes = this.parseWithClause(); }
      } else {
        for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
          // check for keywords used as local names
          var spec = list[i];

          this.checkUnreserved(spec.local);
          // check if export is defined
          this.checkLocalExport(spec.local);

          if (spec.local.type === "Literal") {
            this.raise(spec.local.start, "A string literal cannot be used as an exported binding without `from`.");
          }
        }

        node.source = null;
        if (this.options.ecmaVersion >= 16)
          { node.attributes = []; }
      }
      this.semicolon();
    }
    return this.finishNode(node, "ExportNamedDeclaration")
  };

  pp$8.parseExportDeclaration = function(node) {
    return this.parseStatement(null)
  };

  pp$8.parseExportDefaultDeclaration = function() {
    var isAsync;
    if (this.type === types$1._function || (isAsync = this.isAsyncFunction())) {
      var fNode = this.startNode();
      this.next();
      if (isAsync) { this.next(); }
      return this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync)
    } else if (this.type === types$1._class) {
      var cNode = this.startNode();
      return this.parseClass(cNode, "nullableID")
    } else {
      var declaration = this.parseMaybeAssign();
      this.semicolon();
      return declaration
    }
  };

  pp$8.checkExport = function(exports, name, pos) {
    if (!exports) { return }
    if (typeof name !== "string")
      { name = name.type === "Identifier" ? name.name : name.value; }
    if (hasOwn(exports, name))
      { this.raiseRecoverable(pos, "Duplicate export '" + name + "'"); }
    exports[name] = true;
  };

  pp$8.checkPatternExport = function(exports, pat) {
    var type = pat.type;
    if (type === "Identifier")
      { this.checkExport(exports, pat, pat.start); }
    else if (type === "ObjectPattern")
      { for (var i = 0, list = pat.properties; i < list.length; i += 1)
        {
          var prop = list[i];

          this.checkPatternExport(exports, prop);
        } }
    else if (type === "ArrayPattern")
      { for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
        var elt = list$1[i$1];

          if (elt) { this.checkPatternExport(exports, elt); }
      } }
    else if (type === "Property")
      { this.checkPatternExport(exports, pat.value); }
    else if (type === "AssignmentPattern")
      { this.checkPatternExport(exports, pat.left); }
    else if (type === "RestElement")
      { this.checkPatternExport(exports, pat.argument); }
  };

  pp$8.checkVariableExport = function(exports, decls) {
    if (!exports) { return }
    for (var i = 0, list = decls; i < list.length; i += 1)
      {
      var decl = list[i];

      this.checkPatternExport(exports, decl.id);
    }
  };

  pp$8.shouldParseExportStatement = function() {
    return this.type.keyword === "var" ||
      this.type.keyword === "const" ||
      this.type.keyword === "class" ||
      this.type.keyword === "function" ||
      this.isLet() ||
      this.isAsyncFunction()
  };

  // Parses a comma-separated list of module exports.

  pp$8.parseExportSpecifier = function(exports) {
    var node = this.startNode();
    node.local = this.parseModuleExportName();

    node.exported = this.eatContextual("as") ? this.parseModuleExportName() : node.local;
    this.checkExport(
      exports,
      node.exported,
      node.exported.start
    );

    return this.finishNode(node, "ExportSpecifier")
  };

  pp$8.parseExportSpecifiers = function(exports) {
    var nodes = [], first = true;
    // export { x, y as z } [from '...']
    this.expect(types$1.braceL);
    while (!this.eat(types$1.braceR)) {
      if (!first) {
        this.expect(types$1.comma);
        if (this.afterTrailingComma(types$1.braceR)) { break }
      } else { first = false; }

      nodes.push(this.parseExportSpecifier(exports));
    }
    return nodes
  };

  // Parses import declaration.

  pp$8.parseImport = function(node) {
    this.next();

    // import '...'
    if (this.type === types$1.string) {
      node.specifiers = empty$1;
      node.source = this.parseExprAtom();
    } else {
      node.specifiers = this.parseImportSpecifiers();
      this.expectContextual("from");
      node.source = this.type === types$1.string ? this.parseExprAtom() : this.unexpected();
    }
    if (this.options.ecmaVersion >= 16)
      { node.attributes = this.parseWithClause(); }
    this.semicolon();
    return this.finishNode(node, "ImportDeclaration")
  };

  // Parses a comma-separated list of module imports.

  pp$8.parseImportSpecifier = function() {
    var node = this.startNode();
    node.imported = this.parseModuleExportName();

    if (this.eatContextual("as")) {
      node.local = this.parseIdent();
    } else {
      this.checkUnreserved(node.imported);
      node.local = node.imported;
    }
    this.checkLValSimple(node.local, BIND_LEXICAL);

    return this.finishNode(node, "ImportSpecifier")
  };

  pp$8.parseImportDefaultSpecifier = function() {
    // import defaultObj, { x, y as z } from '...'
    var node = this.startNode();
    node.local = this.parseIdent();
    this.checkLValSimple(node.local, BIND_LEXICAL);
    return this.finishNode(node, "ImportDefaultSpecifier")
  };

  pp$8.parseImportNamespaceSpecifier = function() {
    var node = this.startNode();
    this.next();
    this.expectContextual("as");
    node.local = this.parseIdent();
    this.checkLValSimple(node.local, BIND_LEXICAL);
    return this.finishNode(node, "ImportNamespaceSpecifier")
  };

  pp$8.parseImportSpecifiers = function() {
    var nodes = [], first = true;
    if (this.type === types$1.name) {
      nodes.push(this.parseImportDefaultSpecifier());
      if (!this.eat(types$1.comma)) { return nodes }
    }
    if (this.type === types$1.star) {
      nodes.push(this.parseImportNamespaceSpecifier());
      return nodes
    }
    this.expect(types$1.braceL);
    while (!this.eat(types$1.braceR)) {
      if (!first) {
        this.expect(types$1.comma);
        if (this.afterTrailingComma(types$1.braceR)) { break }
      } else { first = false; }

      nodes.push(this.parseImportSpecifier());
    }
    return nodes
  };

  pp$8.parseWithClause = function() {
    var nodes = [];
    if (!this.eat(types$1._with)) {
      return nodes
    }
    this.expect(types$1.braceL);
    var attributeKeys = {};
    var first = true;
    while (!this.eat(types$1.braceR)) {
      if (!first) {
        this.expect(types$1.comma);
        if (this.afterTrailingComma(types$1.braceR)) { break }
      } else { first = false; }

      var attr = this.parseImportAttribute();
      var keyName = attr.key.type === "Identifier" ? attr.key.name : attr.key.value;
      if (hasOwn(attributeKeys, keyName))
        { this.raiseRecoverable(attr.key.start, "Duplicate attribute key '" + keyName + "'"); }
      attributeKeys[keyName] = true;
      nodes.push(attr);
    }
    return nodes
  };

  pp$8.parseImportAttribute = function() {
    var node = this.startNode();
    node.key = this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never");
    this.expect(types$1.colon);
    if (this.type !== types$1.string) {
      this.unexpected();
    }
    node.value = this.parseExprAtom();
    return this.finishNode(node, "ImportAttribute")
  };

  pp$8.parseModuleExportName = function() {
    if (this.options.ecmaVersion >= 13 && this.type === types$1.string) {
      var stringLiteral = this.parseLiteral(this.value);
      if (loneSurrogate.test(stringLiteral.value)) {
        this.raise(stringLiteral.start, "An export name cannot include a lone surrogate.");
      }
      return stringLiteral
    }
    return this.parseIdent(true)
  };

  // Set `ExpressionStatement#directive` property for directive prologues.
  pp$8.adaptDirectivePrologue = function(statements) {
    for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
      statements[i].directive = statements[i].expression.raw.slice(1, -1);
    }
  };
  pp$8.isDirectiveCandidate = function(statement) {
    return (
      this.options.ecmaVersion >= 5 &&
      statement.type === "ExpressionStatement" &&
      statement.expression.type === "Literal" &&
      typeof statement.expression.value === "string" &&
      // Reject parenthesized strings.
      (this.input[statement.start] === "\"" || this.input[statement.start] === "'")
    )
  };

  var pp$7 = Parser$1.prototype;

  // Convert existing expression atom to assignable pattern
  // if possible.

  pp$7.toAssignable = function(node, isBinding, refDestructuringErrors) {
    if (this.options.ecmaVersion >= 6 && node) {
      switch (node.type) {
      case "Identifier":
        if (this.inAsync && node.name === "await")
          { this.raise(node.start, "Cannot use 'await' as identifier inside an async function"); }
        break

      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
        break

      case "ObjectExpression":
        node.type = "ObjectPattern";
        if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
        for (var i = 0, list = node.properties; i < list.length; i += 1) {
          var prop = list[i];

        this.toAssignable(prop, isBinding);
          // Early error:
          //   AssignmentRestProperty[Yield, Await] :
          //     `...` DestructuringAssignmentTarget[Yield, Await]
          //
          //   It is a Syntax Error if |DestructuringAssignmentTarget| is an |ArrayLiteral| or an |ObjectLiteral|.
          if (
            prop.type === "RestElement" &&
            (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")
          ) {
            this.raise(prop.argument.start, "Unexpected token");
          }
        }
        break

      case "Property":
        // AssignmentProperty has type === "Property"
        if (node.kind !== "init") { this.raise(node.key.start, "Object pattern can't contain getter or setter"); }
        this.toAssignable(node.value, isBinding);
        break

      case "ArrayExpression":
        node.type = "ArrayPattern";
        if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
        this.toAssignableList(node.elements, isBinding);
        break

      case "SpreadElement":
        node.type = "RestElement";
        this.toAssignable(node.argument, isBinding);
        if (node.argument.type === "AssignmentPattern")
          { this.raise(node.argument.start, "Rest elements cannot have a default value"); }
        break

      case "AssignmentExpression":
        if (node.operator !== "=") { this.raise(node.left.end, "Only '=' operator can be used for specifying default value."); }
        node.type = "AssignmentPattern";
        delete node.operator;
        this.toAssignable(node.left, isBinding);
        break

      case "ParenthesizedExpression":
        this.toAssignable(node.expression, isBinding, refDestructuringErrors);
        break

      case "ChainExpression":
        this.raiseRecoverable(node.start, "Optional chaining cannot appear in left-hand side");
        break

      case "MemberExpression":
        if (!isBinding) { break }

      default:
        this.raise(node.start, "Assigning to rvalue");
      }
    } else if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
    return node
  };

  // Convert list of expression atoms to binding list.

  pp$7.toAssignableList = function(exprList, isBinding) {
    var end = exprList.length;
    for (var i = 0; i < end; i++) {
      var elt = exprList[i];
      if (elt) { this.toAssignable(elt, isBinding); }
    }
    if (end) {
      var last = exprList[end - 1];
      if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
        { this.unexpected(last.argument.start); }
    }
    return exprList
  };

  // Parses spread element.

  pp$7.parseSpread = function(refDestructuringErrors) {
    var node = this.startNode();
    this.next();
    node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    return this.finishNode(node, "SpreadElement")
  };

  pp$7.parseRestBinding = function() {
    var node = this.startNode();
    this.next();

    // RestElement inside of a function parameter must be an identifier
    if (this.options.ecmaVersion === 6 && this.type !== types$1.name)
      { this.unexpected(); }

    node.argument = this.parseBindingAtom();

    return this.finishNode(node, "RestElement")
  };

  // Parses lvalue (assignable) atom.

  pp$7.parseBindingAtom = function() {
    if (this.options.ecmaVersion >= 6) {
      switch (this.type) {
      case types$1.bracketL:
        var node = this.startNode();
        this.next();
        node.elements = this.parseBindingList(types$1.bracketR, true, true);
        return this.finishNode(node, "ArrayPattern")

      case types$1.braceL:
        return this.parseObj(true)
      }
    }
    return this.parseIdent()
  };

  pp$7.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowModifiers) {
    var elts = [], first = true;
    while (!this.eat(close)) {
      if (first) { first = false; }
      else { this.expect(types$1.comma); }
      if (allowEmpty && this.type === types$1.comma) {
        elts.push(null);
      } else if (allowTrailingComma && this.afterTrailingComma(close)) {
        break
      } else if (this.type === types$1.ellipsis) {
        var rest = this.parseRestBinding();
        this.parseBindingListItem(rest);
        elts.push(rest);
        if (this.type === types$1.comma) { this.raiseRecoverable(this.start, "Comma is not permitted after the rest element"); }
        this.expect(close);
        break
      } else {
        elts.push(this.parseAssignableListItem(allowModifiers));
      }
    }
    return elts
  };

  pp$7.parseAssignableListItem = function(allowModifiers) {
    var elem = this.parseMaybeDefault(this.start, this.startLoc);
    this.parseBindingListItem(elem);
    return elem
  };

  pp$7.parseBindingListItem = function(param) {
    return param
  };

  // Parses assignment pattern around given atom if possible.

  pp$7.parseMaybeDefault = function(startPos, startLoc, left) {
    left = left || this.parseBindingAtom();
    if (this.options.ecmaVersion < 6 || !this.eat(types$1.eq)) { return left }
    var node = this.startNodeAt(startPos, startLoc);
    node.left = left;
    node.right = this.parseMaybeAssign();
    return this.finishNode(node, "AssignmentPattern")
  };

  // The following three functions all verify that a node is an lvalue —
  // something that can be bound, or assigned to. In order to do so, they perform
  // a variety of checks:
  //
  // - Check that none of the bound/assigned-to identifiers are reserved words.
  // - Record name declarations for bindings in the appropriate scope.
  // - Check duplicate argument names, if checkClashes is set.
  //
  // If a complex binding pattern is encountered (e.g., object and array
  // destructuring), the entire pattern is recursively checked.
  //
  // There are three versions of checkLVal*() appropriate for different
  // circumstances:
  //
  // - checkLValSimple() shall be used if the syntactic construct supports
  //   nothing other than identifiers and member expressions. Parenthesized
  //   expressions are also correctly handled. This is generally appropriate for
  //   constructs for which the spec says
  //
  //   > It is a Syntax Error if AssignmentTargetType of [the production] is not
  //   > simple.
  //
  //   It is also appropriate for checking if an identifier is valid and not
  //   defined elsewhere, like import declarations or function/class identifiers.
  //
  //   Examples where this is used include:
  //     a += …;
  //     import a from '…';
  //   where a is the node to be checked.
  //
  // - checkLValPattern() shall be used if the syntactic construct supports
  //   anything checkLValSimple() supports, as well as object and array
  //   destructuring patterns. This is generally appropriate for constructs for
  //   which the spec says
  //
  //   > It is a Syntax Error if [the production] is neither an ObjectLiteral nor
  //   > an ArrayLiteral and AssignmentTargetType of [the production] is not
  //   > simple.
  //
  //   Examples where this is used include:
  //     (a = …);
  //     const a = …;
  //     try { … } catch (a) { … }
  //   where a is the node to be checked.
  //
  // - checkLValInnerPattern() shall be used if the syntactic construct supports
  //   anything checkLValPattern() supports, as well as default assignment
  //   patterns, rest elements, and other constructs that may appear within an
  //   object or array destructuring pattern.
  //
  //   As a special case, function parameters also use checkLValInnerPattern(),
  //   as they also support defaults and rest constructs.
  //
  // These functions deliberately support both assignment and binding constructs,
  // as the logic for both is exceedingly similar. If the node is the target of
  // an assignment, then bindingType should be set to BIND_NONE. Otherwise, it
  // should be set to the appropriate BIND_* constant, like BIND_VAR or
  // BIND_LEXICAL.
  //
  // If the function is called with a non-BIND_NONE bindingType, then
  // additionally a checkClashes object may be specified to allow checking for
  // duplicate argument names. checkClashes is ignored if the provided construct
  // is an assignment (i.e., bindingType is BIND_NONE).

  pp$7.checkLValSimple = function(expr, bindingType, checkClashes) {
    if ( bindingType === void 0 ) bindingType = BIND_NONE;

    var isBind = bindingType !== BIND_NONE;

    switch (expr.type) {
    case "Identifier":
      if (this.strict && this.reservedWordsStrictBind.test(expr.name))
        { this.raiseRecoverable(expr.start, (isBind ? "Binding " : "Assigning to ") + expr.name + " in strict mode"); }
      if (isBind) {
        if (bindingType === BIND_LEXICAL && expr.name === "let")
          { this.raiseRecoverable(expr.start, "let is disallowed as a lexically bound name"); }
        if (checkClashes) {
          if (hasOwn(checkClashes, expr.name))
            { this.raiseRecoverable(expr.start, "Argument name clash"); }
          checkClashes[expr.name] = true;
        }
        if (bindingType !== BIND_OUTSIDE) { this.declareName(expr.name, bindingType, expr.start); }
      }
      break

    case "ChainExpression":
      this.raiseRecoverable(expr.start, "Optional chaining cannot appear in left-hand side");
      break

    case "MemberExpression":
      if (isBind) { this.raiseRecoverable(expr.start, "Binding member expression"); }
      break

    case "ParenthesizedExpression":
      if (isBind) { this.raiseRecoverable(expr.start, "Binding parenthesized expression"); }
      return this.checkLValSimple(expr.expression, bindingType, checkClashes)

    default:
      this.raise(expr.start, (isBind ? "Binding" : "Assigning to") + " rvalue");
    }
  };

  pp$7.checkLValPattern = function(expr, bindingType, checkClashes) {
    if ( bindingType === void 0 ) bindingType = BIND_NONE;

    switch (expr.type) {
    case "ObjectPattern":
      for (var i = 0, list = expr.properties; i < list.length; i += 1) {
        var prop = list[i];

      this.checkLValInnerPattern(prop, bindingType, checkClashes);
      }
      break

    case "ArrayPattern":
      for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
        var elem = list$1[i$1];

      if (elem) { this.checkLValInnerPattern(elem, bindingType, checkClashes); }
      }
      break

    default:
      this.checkLValSimple(expr, bindingType, checkClashes);
    }
  };

  pp$7.checkLValInnerPattern = function(expr, bindingType, checkClashes) {
    if ( bindingType === void 0 ) bindingType = BIND_NONE;

    switch (expr.type) {
    case "Property":
      // AssignmentProperty has type === "Property"
      this.checkLValInnerPattern(expr.value, bindingType, checkClashes);
      break

    case "AssignmentPattern":
      this.checkLValPattern(expr.left, bindingType, checkClashes);
      break

    case "RestElement":
      this.checkLValPattern(expr.argument, bindingType, checkClashes);
      break

    default:
      this.checkLValPattern(expr, bindingType, checkClashes);
    }
  };

  // The algorithm used to determine whether a regexp can appear at a
  // given point in the program is loosely based on sweet.js' approach.
  // See https://github.com/mozilla/sweet.js/wiki/design


  var TokContext = function TokContext(token, isExpr, preserveSpace, override, generator) {
    this.token = token;
    this.isExpr = !!isExpr;
    this.preserveSpace = !!preserveSpace;
    this.override = override;
    this.generator = !!generator;
  };

  var types$2 = {
    b_stat: new TokContext("{", false),
    b_expr: new TokContext("{", true),
    b_tmpl: new TokContext("${", false),
    p_stat: new TokContext("(", false),
    p_expr: new TokContext("(", true),
    q_tmpl: new TokContext("`", true, true, function (p) { return p.tryReadTemplateToken(); }),
    f_stat: new TokContext("function", false),
    f_expr: new TokContext("function", true),
    f_expr_gen: new TokContext("function", true, false, null, true),
    f_gen: new TokContext("function", false, false, null, true)
  };

  var pp$6 = Parser$1.prototype;

  pp$6.initialContext = function() {
    return [types$2.b_stat]
  };

  pp$6.curContext = function() {
    return this.context[this.context.length - 1]
  };

  pp$6.braceIsBlock = function(prevType) {
    var parent = this.curContext();
    if (parent === types$2.f_expr || parent === types$2.f_stat)
      { return true }
    if (prevType === types$1.colon && (parent === types$2.b_stat || parent === types$2.b_expr))
      { return !parent.isExpr }

    // The check for `tt.name && exprAllowed` detects whether we are
    // after a `yield` or `of` construct. See the `updateContext` for
    // `tt.name`.
    if (prevType === types$1._return || prevType === types$1.name && this.exprAllowed)
      { return lineBreak.test(this.input.slice(this.lastTokEnd, this.start)) }
    if (prevType === types$1._else || prevType === types$1.semi || prevType === types$1.eof || prevType === types$1.parenR || prevType === types$1.arrow)
      { return true }
    if (prevType === types$1.braceL)
      { return parent === types$2.b_stat }
    if (prevType === types$1._var || prevType === types$1._const || prevType === types$1.name)
      { return false }
    return !this.exprAllowed
  };

  pp$6.inGeneratorContext = function() {
    for (var i = this.context.length - 1; i >= 1; i--) {
      var context = this.context[i];
      if (context.token === "function")
        { return context.generator }
    }
    return false
  };

  pp$6.updateContext = function(prevType) {
    var update, type = this.type;
    if (type.keyword && prevType === types$1.dot)
      { this.exprAllowed = false; }
    else if (update = type.updateContext)
      { update.call(this, prevType); }
    else
      { this.exprAllowed = type.beforeExpr; }
  };

  // Used to handle edge cases when token context could not be inferred correctly during tokenization phase

  pp$6.overrideContext = function(tokenCtx) {
    if (this.curContext() !== tokenCtx) {
      this.context[this.context.length - 1] = tokenCtx;
    }
  };

  // Token-specific context update code

  types$1.parenR.updateContext = types$1.braceR.updateContext = function() {
    if (this.context.length === 1) {
      this.exprAllowed = true;
      return
    }
    var out = this.context.pop();
    if (out === types$2.b_stat && this.curContext().token === "function") {
      out = this.context.pop();
    }
    this.exprAllowed = !out.isExpr;
  };

  types$1.braceL.updateContext = function(prevType) {
    this.context.push(this.braceIsBlock(prevType) ? types$2.b_stat : types$2.b_expr);
    this.exprAllowed = true;
  };

  types$1.dollarBraceL.updateContext = function() {
    this.context.push(types$2.b_tmpl);
    this.exprAllowed = true;
  };

  types$1.parenL.updateContext = function(prevType) {
    var statementParens = prevType === types$1._if || prevType === types$1._for || prevType === types$1._with || prevType === types$1._while;
    this.context.push(statementParens ? types$2.p_stat : types$2.p_expr);
    this.exprAllowed = true;
  };

  types$1.incDec.updateContext = function() {
    // tokExprAllowed stays unchanged
  };

  types$1._function.updateContext = types$1._class.updateContext = function(prevType) {
    if (prevType.beforeExpr && prevType !== types$1._else &&
        !(prevType === types$1.semi && this.curContext() !== types$2.p_stat) &&
        !(prevType === types$1._return && lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) &&
        !((prevType === types$1.colon || prevType === types$1.braceL) && this.curContext() === types$2.b_stat))
      { this.context.push(types$2.f_expr); }
    else
      { this.context.push(types$2.f_stat); }
    this.exprAllowed = false;
  };

  types$1.colon.updateContext = function() {
    if (this.curContext().token === "function") { this.context.pop(); }
    this.exprAllowed = true;
  };

  types$1.backQuote.updateContext = function() {
    if (this.curContext() === types$2.q_tmpl)
      { this.context.pop(); }
    else
      { this.context.push(types$2.q_tmpl); }
    this.exprAllowed = false;
  };

  types$1.star.updateContext = function(prevType) {
    if (prevType === types$1._function) {
      var index = this.context.length - 1;
      if (this.context[index] === types$2.f_expr)
        { this.context[index] = types$2.f_expr_gen; }
      else
        { this.context[index] = types$2.f_gen; }
    }
    this.exprAllowed = true;
  };

  types$1.name.updateContext = function(prevType) {
    var allowed = false;
    if (this.options.ecmaVersion >= 6 && prevType !== types$1.dot) {
      if (this.value === "of" && !this.exprAllowed ||
          this.value === "yield" && this.inGeneratorContext())
        { allowed = true; }
    }
    this.exprAllowed = allowed;
  };

  // A recursive descent parser operates by defining functions for all
  // syntactic elements, and recursively calling those, each function
  // advancing the input stream and returning an AST node. Precedence
  // of constructs (for example, the fact that `!x[1]` means `!(x[1])`
  // instead of `(!x)[1]` is handled by the fact that the parser
  // function that parses unary prefix operators is called first, and
  // in turn calls the function that parses `[]` subscripts — that
  // way, it'll receive the node for `x[1]` already parsed, and wraps
  // *that* in the unary operator node.
  //
  // Acorn uses an [operator precedence parser][opp] to handle binary
  // operator precedence, because it is much more compact than using
  // the technique outlined above, which uses different, nesting
  // functions to specify precedence, for all of the ten binary
  // precedence levels that JavaScript defines.
  //
  // [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser


  var pp$5 = Parser$1.prototype;

  // Check if property name clashes with already added.
  // Object/class getters and setters are not allowed to clash —
  // either with each other or with an init property — and in
  // strict mode, init properties are also not allowed to be repeated.

  pp$5.checkPropClash = function(prop, propHash, refDestructuringErrors) {
    if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement")
      { return }
    if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
      { return }
    var key = prop.key;
    var name;
    switch (key.type) {
    case "Identifier": name = key.name; break
    case "Literal": name = String(key.value); break
    default: return
    }
    var kind = prop.kind;
    if (this.options.ecmaVersion >= 6) {
      if (name === "__proto__" && kind === "init") {
        if (propHash.proto) {
          if (refDestructuringErrors) {
            if (refDestructuringErrors.doubleProto < 0) {
              refDestructuringErrors.doubleProto = key.start;
            }
          } else {
            this.raiseRecoverable(key.start, "Redefinition of __proto__ property");
          }
        }
        propHash.proto = true;
      }
      return
    }
    name = "$" + name;
    var other = propHash[name];
    if (other) {
      var redefinition;
      if (kind === "init") {
        redefinition = this.strict && other.init || other.get || other.set;
      } else {
        redefinition = other.init || other[kind];
      }
      if (redefinition)
        { this.raiseRecoverable(key.start, "Redefinition of property"); }
    } else {
      other = propHash[name] = {
        init: false,
        get: false,
        set: false
      };
    }
    other[kind] = true;
  };

  // ### Expression parsing

  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function(s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.

  // Parse a full expression. The optional arguments are used to
  // forbid the `in` operator (in for loops initalization expressions)
  // and provide reference for storing '=' operator inside shorthand
  // property assignment in contexts where both object expression
  // and object pattern might appear (so it's possible to raise
  // delayed syntax error at correct position).

  pp$5.parseExpression = function(forInit, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseMaybeAssign(forInit, refDestructuringErrors);
    if (this.type === types$1.comma) {
      var node = this.startNodeAt(startPos, startLoc);
      node.expressions = [expr];
      while (this.eat(types$1.comma)) { node.expressions.push(this.parseMaybeAssign(forInit, refDestructuringErrors)); }
      return this.finishNode(node, "SequenceExpression")
    }
    return expr
  };

  // Parse an assignment expression. This includes applications of
  // operators like `+=`.

  pp$5.parseMaybeAssign = function(forInit, refDestructuringErrors, afterLeftParse) {
    if (this.isContextual("yield")) {
      if (this.inGenerator) { return this.parseYield(forInit) }
      // The tokenizer will assume an expression is allowed after
      // `yield`, but this isn't that kind of yield
      else { this.exprAllowed = false; }
    }

    var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1, oldDoubleProto = -1;
    if (refDestructuringErrors) {
      oldParenAssign = refDestructuringErrors.parenthesizedAssign;
      oldTrailingComma = refDestructuringErrors.trailingComma;
      oldDoubleProto = refDestructuringErrors.doubleProto;
      refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
    } else {
      refDestructuringErrors = new DestructuringErrors;
      ownDestructuringErrors = true;
    }

    var startPos = this.start, startLoc = this.startLoc;
    if (this.type === types$1.parenL || this.type === types$1.name) {
      this.potentialArrowAt = this.start;
      this.potentialArrowInForAwait = forInit === "await";
    }
    var left = this.parseMaybeConditional(forInit, refDestructuringErrors);
    if (afterLeftParse) { left = afterLeftParse.call(this, left, startPos, startLoc); }
    if (this.type.isAssign) {
      var node = this.startNodeAt(startPos, startLoc);
      node.operator = this.value;
      if (this.type === types$1.eq)
        { left = this.toAssignable(left, false, refDestructuringErrors); }
      if (!ownDestructuringErrors) {
        refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = refDestructuringErrors.doubleProto = -1;
      }
      if (refDestructuringErrors.shorthandAssign >= left.start)
        { refDestructuringErrors.shorthandAssign = -1; } // reset because shorthand default was used correctly
      if (this.type === types$1.eq)
        { this.checkLValPattern(left); }
      else
        { this.checkLValSimple(left); }
      node.left = left;
      this.next();
      node.right = this.parseMaybeAssign(forInit);
      if (oldDoubleProto > -1) { refDestructuringErrors.doubleProto = oldDoubleProto; }
      return this.finishNode(node, "AssignmentExpression")
    } else {
      if (ownDestructuringErrors) { this.checkExpressionErrors(refDestructuringErrors, true); }
    }
    if (oldParenAssign > -1) { refDestructuringErrors.parenthesizedAssign = oldParenAssign; }
    if (oldTrailingComma > -1) { refDestructuringErrors.trailingComma = oldTrailingComma; }
    return left
  };

  // Parse a ternary conditional (`?:`) operator.

  pp$5.parseMaybeConditional = function(forInit, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseExprOps(forInit, refDestructuringErrors);
    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
    if (this.eat(types$1.question)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.test = expr;
      node.consequent = this.parseMaybeAssign();
      this.expect(types$1.colon);
      node.alternate = this.parseMaybeAssign(forInit);
      return this.finishNode(node, "ConditionalExpression")
    }
    return expr
  };

  // Start the precedence parser.

  pp$5.parseExprOps = function(forInit, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseMaybeUnary(refDestructuringErrors, false, false, forInit);
    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
    return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, forInit)
  };

  // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.

  pp$5.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, forInit) {
    var prec = this.type.binop;
    if (prec != null && (!forInit || this.type !== types$1._in)) {
      if (prec > minPrec) {
        var logical = this.type === types$1.logicalOR || this.type === types$1.logicalAND;
        var coalesce = this.type === types$1.coalesce;
        if (coalesce) {
          // Handle the precedence of `tt.coalesce` as equal to the range of logical expressions.
          // In other words, `node.right` shouldn't contain logical expressions in order to check the mixed error.
          prec = types$1.logicalAND.binop;
        }
        var op = this.value;
        this.next();
        var startPos = this.start, startLoc = this.startLoc;
        var right = this.parseExprOp(this.parseMaybeUnary(null, false, false, forInit), startPos, startLoc, prec, forInit);
        var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical || coalesce);
        if ((logical && this.type === types$1.coalesce) || (coalesce && (this.type === types$1.logicalOR || this.type === types$1.logicalAND))) {
          this.raiseRecoverable(this.start, "Logical expressions and coalesce expressions cannot be mixed. Wrap either by parentheses");
        }
        return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, forInit)
      }
    }
    return left
  };

  pp$5.buildBinary = function(startPos, startLoc, left, right, op, logical) {
    if (right.type === "PrivateIdentifier") { this.raise(right.start, "Private identifier can only be left side of binary expression"); }
    var node = this.startNodeAt(startPos, startLoc);
    node.left = left;
    node.operator = op;
    node.right = right;
    return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
  };

  // Parse unary operators, both prefix and postfix.

  pp$5.parseMaybeUnary = function(refDestructuringErrors, sawUnary, incDec, forInit) {
    var startPos = this.start, startLoc = this.startLoc, expr;
    if (this.isContextual("await") && this.canAwait) {
      expr = this.parseAwait(forInit);
      sawUnary = true;
    } else if (this.type.prefix) {
      var node = this.startNode(), update = this.type === types$1.incDec;
      node.operator = this.value;
      node.prefix = true;
      this.next();
      node.argument = this.parseMaybeUnary(null, true, update, forInit);
      this.checkExpressionErrors(refDestructuringErrors, true);
      if (update) { this.checkLValSimple(node.argument); }
      else if (this.strict && node.operator === "delete" && isLocalVariableAccess(node.argument))
        { this.raiseRecoverable(node.start, "Deleting local variable in strict mode"); }
      else if (node.operator === "delete" && isPrivateFieldAccess(node.argument))
        { this.raiseRecoverable(node.start, "Private fields can not be deleted"); }
      else { sawUnary = true; }
      expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
    } else if (!sawUnary && this.type === types$1.privateId) {
      if ((forInit || this.privateNameStack.length === 0) && this.options.checkPrivateFields) { this.unexpected(); }
      expr = this.parsePrivateIdent();
      // only could be private fields in 'in', such as #x in obj
      if (this.type !== types$1._in) { this.unexpected(); }
    } else {
      expr = this.parseExprSubscripts(refDestructuringErrors, forInit);
      if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
      while (this.type.postfix && !this.canInsertSemicolon()) {
        var node$1 = this.startNodeAt(startPos, startLoc);
        node$1.operator = this.value;
        node$1.prefix = false;
        node$1.argument = expr;
        this.checkLValSimple(expr);
        this.next();
        expr = this.finishNode(node$1, "UpdateExpression");
      }
    }

    if (!incDec && this.eat(types$1.starstar)) {
      if (sawUnary)
        { this.unexpected(this.lastTokStart); }
      else
        { return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false, false, forInit), "**", false) }
    } else {
      return expr
    }
  };

  function isLocalVariableAccess(node) {
    return (
      node.type === "Identifier" ||
      node.type === "ParenthesizedExpression" && isLocalVariableAccess(node.expression)
    )
  }

  function isPrivateFieldAccess(node) {
    return (
      node.type === "MemberExpression" && node.property.type === "PrivateIdentifier" ||
      node.type === "ChainExpression" && isPrivateFieldAccess(node.expression) ||
      node.type === "ParenthesizedExpression" && isPrivateFieldAccess(node.expression)
    )
  }

  // Parse call, dot, and `[]`-subscript expressions.

  pp$5.parseExprSubscripts = function(refDestructuringErrors, forInit) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseExprAtom(refDestructuringErrors, forInit);
    if (expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")")
      { return expr }
    var result = this.parseSubscripts(expr, startPos, startLoc, false, forInit);
    if (refDestructuringErrors && result.type === "MemberExpression") {
      if (refDestructuringErrors.parenthesizedAssign >= result.start) { refDestructuringErrors.parenthesizedAssign = -1; }
      if (refDestructuringErrors.parenthesizedBind >= result.start) { refDestructuringErrors.parenthesizedBind = -1; }
      if (refDestructuringErrors.trailingComma >= result.start) { refDestructuringErrors.trailingComma = -1; }
    }
    return result
  };

  pp$5.parseSubscripts = function(base, startPos, startLoc, noCalls, forInit) {
    var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" &&
        this.lastTokEnd === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 &&
        this.potentialArrowAt === base.start;
    var optionalChained = false;

    while (true) {
      var element = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit);

      if (element.optional) { optionalChained = true; }
      if (element === base || element.type === "ArrowFunctionExpression") {
        if (optionalChained) {
          var chainNode = this.startNodeAt(startPos, startLoc);
          chainNode.expression = element;
          element = this.finishNode(chainNode, "ChainExpression");
        }
        return element
      }

      base = element;
    }
  };

  pp$5.shouldParseAsyncArrow = function() {
    return !this.canInsertSemicolon() && this.eat(types$1.arrow)
  };

  pp$5.parseSubscriptAsyncArrow = function(startPos, startLoc, exprList, forInit) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, true, forInit)
  };

  pp$5.parseSubscript = function(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit) {
    var optionalSupported = this.options.ecmaVersion >= 11;
    var optional = optionalSupported && this.eat(types$1.questionDot);
    if (noCalls && optional) { this.raise(this.lastTokStart, "Optional chaining cannot appear in the callee of new expressions"); }

    var computed = this.eat(types$1.bracketL);
    if (computed || (optional && this.type !== types$1.parenL && this.type !== types$1.backQuote) || this.eat(types$1.dot)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.object = base;
      if (computed) {
        node.property = this.parseExpression();
        this.expect(types$1.bracketR);
      } else if (this.type === types$1.privateId && base.type !== "Super") {
        node.property = this.parsePrivateIdent();
      } else {
        node.property = this.parseIdent(this.options.allowReserved !== "never");
      }
      node.computed = !!computed;
      if (optionalSupported) {
        node.optional = optional;
      }
      base = this.finishNode(node, "MemberExpression");
    } else if (!noCalls && this.eat(types$1.parenL)) {
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
      this.yieldPos = 0;
      this.awaitPos = 0;
      this.awaitIdentPos = 0;
      var exprList = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false, refDestructuringErrors);
      if (maybeAsyncArrow && !optional && this.shouldParseAsyncArrow()) {
        this.checkPatternErrors(refDestructuringErrors, false);
        this.checkYieldAwaitInDefaultParams();
        if (this.awaitIdentPos > 0)
          { this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function"); }
        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        this.awaitIdentPos = oldAwaitIdentPos;
        return this.parseSubscriptAsyncArrow(startPos, startLoc, exprList, forInit)
      }
      this.checkExpressionErrors(refDestructuringErrors, true);
      this.yieldPos = oldYieldPos || this.yieldPos;
      this.awaitPos = oldAwaitPos || this.awaitPos;
      this.awaitIdentPos = oldAwaitIdentPos || this.awaitIdentPos;
      var node$1 = this.startNodeAt(startPos, startLoc);
      node$1.callee = base;
      node$1.arguments = exprList;
      if (optionalSupported) {
        node$1.optional = optional;
      }
      base = this.finishNode(node$1, "CallExpression");
    } else if (this.type === types$1.backQuote) {
      if (optional || optionalChained) {
        this.raise(this.start, "Optional chaining cannot appear in the tag of tagged template expressions");
      }
      var node$2 = this.startNodeAt(startPos, startLoc);
      node$2.tag = base;
      node$2.quasi = this.parseTemplate({isTagged: true});
      base = this.finishNode(node$2, "TaggedTemplateExpression");
    }
    return base
  };

  // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.

  pp$5.parseExprAtom = function(refDestructuringErrors, forInit, forNew) {
    // If a division operator appears in an expression position, the
    // tokenizer got confused, and we force it to read a regexp instead.
    if (this.type === types$1.slash) { this.readRegexp(); }

    var node, canBeArrow = this.potentialArrowAt === this.start;
    switch (this.type) {
    case types$1._super:
      if (!this.allowSuper)
        { this.raise(this.start, "'super' keyword outside a method"); }
      node = this.startNode();
      this.next();
      if (this.type === types$1.parenL && !this.allowDirectSuper)
        { this.raise(node.start, "super() call outside constructor of a subclass"); }
      // The `super` keyword can appear at below:
      // SuperProperty:
      //     super [ Expression ]
      //     super . IdentifierName
      // SuperCall:
      //     super ( Arguments )
      if (this.type !== types$1.dot && this.type !== types$1.bracketL && this.type !== types$1.parenL)
        { this.unexpected(); }
      return this.finishNode(node, "Super")

    case types$1._this:
      node = this.startNode();
      this.next();
      return this.finishNode(node, "ThisExpression")

    case types$1.name:
      var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
      var id = this.parseIdent(false);
      if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types$1._function)) {
        this.overrideContext(types$2.f_expr);
        return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true, forInit)
      }
      if (canBeArrow && !this.canInsertSemicolon()) {
        if (this.eat(types$1.arrow))
          { return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false, forInit) }
        if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types$1.name && !containsEsc &&
            (!this.potentialArrowInForAwait || this.value !== "of" || this.containsEsc)) {
          id = this.parseIdent(false);
          if (this.canInsertSemicolon() || !this.eat(types$1.arrow))
            { this.unexpected(); }
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true, forInit)
        }
      }
      return id

    case types$1.regexp:
      var value = this.value;
      node = this.parseLiteral(value.value);
      node.regex = {pattern: value.pattern, flags: value.flags};
      return node

    case types$1.num: case types$1.string:
      return this.parseLiteral(this.value)

    case types$1._null: case types$1._true: case types$1._false:
      node = this.startNode();
      node.value = this.type === types$1._null ? null : this.type === types$1._true;
      node.raw = this.type.keyword;
      this.next();
      return this.finishNode(node, "Literal")

    case types$1.parenL:
      var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow, forInit);
      if (refDestructuringErrors) {
        if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
          { refDestructuringErrors.parenthesizedAssign = start; }
        if (refDestructuringErrors.parenthesizedBind < 0)
          { refDestructuringErrors.parenthesizedBind = start; }
      }
      return expr

    case types$1.bracketL:
      node = this.startNode();
      this.next();
      node.elements = this.parseExprList(types$1.bracketR, true, true, refDestructuringErrors);
      return this.finishNode(node, "ArrayExpression")

    case types$1.braceL:
      this.overrideContext(types$2.b_expr);
      return this.parseObj(false, refDestructuringErrors)

    case types$1._function:
      node = this.startNode();
      this.next();
      return this.parseFunction(node, 0)

    case types$1._class:
      return this.parseClass(this.startNode(), false)

    case types$1._new:
      return this.parseNew()

    case types$1.backQuote:
      return this.parseTemplate()

    case types$1._import:
      if (this.options.ecmaVersion >= 11) {
        return this.parseExprImport(forNew)
      } else {
        return this.unexpected()
      }

    default:
      return this.parseExprAtomDefault()
    }
  };

  pp$5.parseExprAtomDefault = function() {
    this.unexpected();
  };

  pp$5.parseExprImport = function(forNew) {
    var node = this.startNode();

    // Consume `import` as an identifier for `import.meta`.
    // Because `this.parseIdent(true)` doesn't check escape sequences, it needs the check of `this.containsEsc`.
    if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword import"); }
    this.next();

    if (this.type === types$1.parenL && !forNew) {
      return this.parseDynamicImport(node)
    } else if (this.type === types$1.dot) {
      var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
      meta.name = "import";
      node.meta = this.finishNode(meta, "Identifier");
      return this.parseImportMeta(node)
    } else {
      this.unexpected();
    }
  };

  pp$5.parseDynamicImport = function(node) {
    this.next(); // skip `(`

    // Parse node.source.
    node.source = this.parseMaybeAssign();

    if (this.options.ecmaVersion >= 16) {
      if (!this.eat(types$1.parenR)) {
        this.expect(types$1.comma);
        if (!this.afterTrailingComma(types$1.parenR)) {
          node.options = this.parseMaybeAssign();
          if (!this.eat(types$1.parenR)) {
            this.expect(types$1.comma);
            if (!this.afterTrailingComma(types$1.parenR)) {
              this.unexpected();
            }
          }
        } else {
          node.options = null;
        }
      } else {
        node.options = null;
      }
    } else {
      // Verify ending.
      if (!this.eat(types$1.parenR)) {
        var errorPos = this.start;
        if (this.eat(types$1.comma) && this.eat(types$1.parenR)) {
          this.raiseRecoverable(errorPos, "Trailing comma is not allowed in import()");
        } else {
          this.unexpected(errorPos);
        }
      }
    }

    return this.finishNode(node, "ImportExpression")
  };

  pp$5.parseImportMeta = function(node) {
    this.next(); // skip `.`

    var containsEsc = this.containsEsc;
    node.property = this.parseIdent(true);

    if (node.property.name !== "meta")
      { this.raiseRecoverable(node.property.start, "The only valid meta property for import is 'import.meta'"); }
    if (containsEsc)
      { this.raiseRecoverable(node.start, "'import.meta' must not contain escaped characters"); }
    if (this.options.sourceType !== "module" && !this.options.allowImportExportEverywhere)
      { this.raiseRecoverable(node.start, "Cannot use 'import.meta' outside a module"); }

    return this.finishNode(node, "MetaProperty")
  };

  pp$5.parseLiteral = function(value) {
    var node = this.startNode();
    node.value = value;
    node.raw = this.input.slice(this.start, this.end);
    if (node.raw.charCodeAt(node.raw.length - 1) === 110)
      { node.bigint = node.value != null ? node.value.toString() : node.raw.slice(0, -1).replace(/_/g, ""); }
    this.next();
    return this.finishNode(node, "Literal")
  };

  pp$5.parseParenExpression = function() {
    this.expect(types$1.parenL);
    var val = this.parseExpression();
    this.expect(types$1.parenR);
    return val
  };

  pp$5.shouldParseArrow = function(exprList) {
    return !this.canInsertSemicolon()
  };

  pp$5.parseParenAndDistinguishExpression = function(canBeArrow, forInit) {
    var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
    if (this.options.ecmaVersion >= 6) {
      this.next();

      var innerStartPos = this.start, innerStartLoc = this.startLoc;
      var exprList = [], first = true, lastIsComma = false;
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
      this.yieldPos = 0;
      this.awaitPos = 0;
      // Do not save awaitIdentPos to allow checking awaits nested in parameters
      while (this.type !== types$1.parenR) {
        first ? first = false : this.expect(types$1.comma);
        if (allowTrailingComma && this.afterTrailingComma(types$1.parenR, true)) {
          lastIsComma = true;
          break
        } else if (this.type === types$1.ellipsis) {
          spreadStart = this.start;
          exprList.push(this.parseParenItem(this.parseRestBinding()));
          if (this.type === types$1.comma) {
            this.raiseRecoverable(
              this.start,
              "Comma is not permitted after the rest element"
            );
          }
          break
        } else {
          exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
        }
      }
      var innerEndPos = this.lastTokEnd, innerEndLoc = this.lastTokEndLoc;
      this.expect(types$1.parenR);

      if (canBeArrow && this.shouldParseArrow(exprList) && this.eat(types$1.arrow)) {
        this.checkPatternErrors(refDestructuringErrors, false);
        this.checkYieldAwaitInDefaultParams();
        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        return this.parseParenArrowList(startPos, startLoc, exprList, forInit)
      }

      if (!exprList.length || lastIsComma) { this.unexpected(this.lastTokStart); }
      if (spreadStart) { this.unexpected(spreadStart); }
      this.checkExpressionErrors(refDestructuringErrors, true);
      this.yieldPos = oldYieldPos || this.yieldPos;
      this.awaitPos = oldAwaitPos || this.awaitPos;

      if (exprList.length > 1) {
        val = this.startNodeAt(innerStartPos, innerStartLoc);
        val.expressions = exprList;
        this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
      } else {
        val = exprList[0];
      }
    } else {
      val = this.parseParenExpression();
    }

    if (this.options.preserveParens) {
      var par = this.startNodeAt(startPos, startLoc);
      par.expression = val;
      return this.finishNode(par, "ParenthesizedExpression")
    } else {
      return val
    }
  };

  pp$5.parseParenItem = function(item) {
    return item
  };

  pp$5.parseParenArrowList = function(startPos, startLoc, exprList, forInit) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, false, forInit)
  };

  // New's precedence is slightly tricky. It must allow its argument to
  // be a `[]` or dot subscript expression, but not a call — at least,
  // not without wrapping it in parentheses. Thus, it uses the noCalls
  // argument to parseSubscripts to prevent it from consuming the
  // argument list.

  var empty = [];

  pp$5.parseNew = function() {
    if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword new"); }
    var node = this.startNode();
    this.next();
    if (this.options.ecmaVersion >= 6 && this.type === types$1.dot) {
      var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
      meta.name = "new";
      node.meta = this.finishNode(meta, "Identifier");
      this.next();
      var containsEsc = this.containsEsc;
      node.property = this.parseIdent(true);
      if (node.property.name !== "target")
        { this.raiseRecoverable(node.property.start, "The only valid meta property for new is 'new.target'"); }
      if (containsEsc)
        { this.raiseRecoverable(node.start, "'new.target' must not contain escaped characters"); }
      if (!this.allowNewDotTarget)
        { this.raiseRecoverable(node.start, "'new.target' can only be used in functions and class static block"); }
      return this.finishNode(node, "MetaProperty")
    }
    var startPos = this.start, startLoc = this.startLoc;
    node.callee = this.parseSubscripts(this.parseExprAtom(null, false, true), startPos, startLoc, true, false);
    if (this.eat(types$1.parenL)) { node.arguments = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false); }
    else { node.arguments = empty; }
    return this.finishNode(node, "NewExpression")
  };

  // Parse template expression.

  pp$5.parseTemplateElement = function(ref) {
    var isTagged = ref.isTagged;

    var elem = this.startNode();
    if (this.type === types$1.invalidTemplate) {
      if (!isTagged) {
        this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
      }
      elem.value = {
        raw: this.value.replace(/\r\n?/g, "\n"),
        cooked: null
      };
    } else {
      elem.value = {
        raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
        cooked: this.value
      };
    }
    this.next();
    elem.tail = this.type === types$1.backQuote;
    return this.finishNode(elem, "TemplateElement")
  };

  pp$5.parseTemplate = function(ref) {
    if ( ref === void 0 ) ref = {};
    var isTagged = ref.isTagged; if ( isTagged === void 0 ) isTagged = false;

    var node = this.startNode();
    this.next();
    node.expressions = [];
    var curElt = this.parseTemplateElement({isTagged: isTagged});
    node.quasis = [curElt];
    while (!curElt.tail) {
      if (this.type === types$1.eof) { this.raise(this.pos, "Unterminated template literal"); }
      this.expect(types$1.dollarBraceL);
      node.expressions.push(this.parseExpression());
      this.expect(types$1.braceR);
      node.quasis.push(curElt = this.parseTemplateElement({isTagged: isTagged}));
    }
    this.next();
    return this.finishNode(node, "TemplateLiteral")
  };

  pp$5.isAsyncProp = function(prop) {
    return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" &&
      (this.type === types$1.name || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword || (this.options.ecmaVersion >= 9 && this.type === types$1.star)) &&
      !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
  };

  // Parse an object literal or binding pattern.

  pp$5.parseObj = function(isPattern, refDestructuringErrors) {
    var node = this.startNode(), first = true, propHash = {};
    node.properties = [];
    this.next();
    while (!this.eat(types$1.braceR)) {
      if (!first) {
        this.expect(types$1.comma);
        if (this.options.ecmaVersion >= 5 && this.afterTrailingComma(types$1.braceR)) { break }
      } else { first = false; }

      var prop = this.parseProperty(isPattern, refDestructuringErrors);
      if (!isPattern) { this.checkPropClash(prop, propHash, refDestructuringErrors); }
      node.properties.push(prop);
    }
    return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
  };

  pp$5.parseProperty = function(isPattern, refDestructuringErrors) {
    var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
    if (this.options.ecmaVersion >= 9 && this.eat(types$1.ellipsis)) {
      if (isPattern) {
        prop.argument = this.parseIdent(false);
        if (this.type === types$1.comma) {
          this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
        }
        return this.finishNode(prop, "RestElement")
      }
      // Parse argument.
      prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
      // To disallow trailing comma via `this.toAssignable()`.
      if (this.type === types$1.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
        refDestructuringErrors.trailingComma = this.start;
      }
      // Finish
      return this.finishNode(prop, "SpreadElement")
    }
    if (this.options.ecmaVersion >= 6) {
      prop.method = false;
      prop.shorthand = false;
      if (isPattern || refDestructuringErrors) {
        startPos = this.start;
        startLoc = this.startLoc;
      }
      if (!isPattern)
        { isGenerator = this.eat(types$1.star); }
    }
    var containsEsc = this.containsEsc;
    this.parsePropertyName(prop);
    if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
      isAsync = true;
      isGenerator = this.options.ecmaVersion >= 9 && this.eat(types$1.star);
      this.parsePropertyName(prop);
    } else {
      isAsync = false;
    }
    this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
    return this.finishNode(prop, "Property")
  };

  pp$5.parseGetterSetter = function(prop) {
    var kind = prop.key.name;
    this.parsePropertyName(prop);
    prop.value = this.parseMethod(false);
    prop.kind = kind;
    var paramCount = prop.kind === "get" ? 0 : 1;
    if (prop.value.params.length !== paramCount) {
      var start = prop.value.start;
      if (prop.kind === "get")
        { this.raiseRecoverable(start, "getter should have no params"); }
      else
        { this.raiseRecoverable(start, "setter should have exactly one param"); }
    } else {
      if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
        { this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params"); }
    }
  };

  pp$5.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
    if ((isGenerator || isAsync) && this.type === types$1.colon)
      { this.unexpected(); }

    if (this.eat(types$1.colon)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
      prop.kind = "init";
    } else if (this.options.ecmaVersion >= 6 && this.type === types$1.parenL) {
      if (isPattern) { this.unexpected(); }
      prop.method = true;
      prop.value = this.parseMethod(isGenerator, isAsync);
      prop.kind = "init";
    } else if (!isPattern && !containsEsc &&
               this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
               (prop.key.name === "get" || prop.key.name === "set") &&
               (this.type !== types$1.comma && this.type !== types$1.braceR && this.type !== types$1.eq)) {
      if (isGenerator || isAsync) { this.unexpected(); }
      this.parseGetterSetter(prop);
    } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
      if (isGenerator || isAsync) { this.unexpected(); }
      this.checkUnreserved(prop.key);
      if (prop.key.name === "await" && !this.awaitIdentPos)
        { this.awaitIdentPos = startPos; }
      if (isPattern) {
        prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
      } else if (this.type === types$1.eq && refDestructuringErrors) {
        if (refDestructuringErrors.shorthandAssign < 0)
          { refDestructuringErrors.shorthandAssign = this.start; }
        prop.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop.key));
      } else {
        prop.value = this.copyNode(prop.key);
      }
      prop.kind = "init";
      prop.shorthand = true;
    } else { this.unexpected(); }
  };

  pp$5.parsePropertyName = function(prop) {
    if (this.options.ecmaVersion >= 6) {
      if (this.eat(types$1.bracketL)) {
        prop.computed = true;
        prop.key = this.parseMaybeAssign();
        this.expect(types$1.bracketR);
        return prop.key
      } else {
        prop.computed = false;
      }
    }
    return prop.key = this.type === types$1.num || this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never")
  };

  // Initialize empty function node.

  pp$5.initFunction = function(node) {
    node.id = null;
    if (this.options.ecmaVersion >= 6) { node.generator = node.expression = false; }
    if (this.options.ecmaVersion >= 8) { node.async = false; }
  };

  // Parse object or class method.

  pp$5.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
    var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

    this.initFunction(node);
    if (this.options.ecmaVersion >= 6)
      { node.generator = isGenerator; }
    if (this.options.ecmaVersion >= 8)
      { node.async = !!isAsync; }

    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));

    this.expect(types$1.parenL);
    node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
    this.checkYieldAwaitInDefaultParams();
    this.parseFunctionBody(node, false, true, false);

    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, "FunctionExpression")
  };

  // Parse arrow function expression with given parameters.

  pp$5.parseArrowExpression = function(node, params, isAsync, forInit) {
    var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

    this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
    this.initFunction(node);
    if (this.options.ecmaVersion >= 8) { node.async = !!isAsync; }

    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;

    node.params = this.toAssignableList(params, true);
    this.parseFunctionBody(node, true, false, forInit);

    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, "ArrowFunctionExpression")
  };

  // Parse function body and check parameters.

  pp$5.parseFunctionBody = function(node, isArrowFunction, isMethod, forInit) {
    var isExpression = isArrowFunction && this.type !== types$1.braceL;
    var oldStrict = this.strict, useStrict = false;

    if (isExpression) {
      node.body = this.parseMaybeAssign(forInit);
      node.expression = true;
      this.checkParams(node, false);
    } else {
      var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
      if (!oldStrict || nonSimple) {
        useStrict = this.strictDirective(this.end);
        // If this is a strict mode function, verify that argument names
        // are not repeated, and it does not try to bind the words `eval`
        // or `arguments`.
        if (useStrict && nonSimple)
          { this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list"); }
      }
      // Start a new scope with regard to labels and the `inFunction`
      // flag (restore them to their old value afterwards).
      var oldLabels = this.labels;
      this.labels = [];
      if (useStrict) { this.strict = true; }

      // Add the params to varDeclaredNames to ensure that an error is thrown
      // if a let/const declaration in the function clashes with one of the params.
      this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
      // Ensure the function name isn't a forbidden identifier in strict mode, e.g. 'eval'
      if (this.strict && node.id) { this.checkLValSimple(node.id, BIND_OUTSIDE); }
      node.body = this.parseBlock(false, undefined, useStrict && !oldStrict);
      node.expression = false;
      this.adaptDirectivePrologue(node.body.body);
      this.labels = oldLabels;
    }
    this.exitScope();
  };

  pp$5.isSimpleParamList = function(params) {
    for (var i = 0, list = params; i < list.length; i += 1)
      {
      var param = list[i];

      if (param.type !== "Identifier") { return false
    } }
    return true
  };

  // Checks function params for various disallowed patterns such as using "eval"
  // or "arguments" and duplicate parameters.

  pp$5.checkParams = function(node, allowDuplicates) {
    var nameHash = Object.create(null);
    for (var i = 0, list = node.params; i < list.length; i += 1)
      {
      var param = list[i];

      this.checkLValInnerPattern(param, BIND_VAR, allowDuplicates ? null : nameHash);
    }
  };

  // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).

  pp$5.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
    var elts = [], first = true;
    while (!this.eat(close)) {
      if (!first) {
        this.expect(types$1.comma);
        if (allowTrailingComma && this.afterTrailingComma(close)) { break }
      } else { first = false; }

      var elt = (void 0);
      if (allowEmpty && this.type === types$1.comma)
        { elt = null; }
      else if (this.type === types$1.ellipsis) {
        elt = this.parseSpread(refDestructuringErrors);
        if (refDestructuringErrors && this.type === types$1.comma && refDestructuringErrors.trailingComma < 0)
          { refDestructuringErrors.trailingComma = this.start; }
      } else {
        elt = this.parseMaybeAssign(false, refDestructuringErrors);
      }
      elts.push(elt);
    }
    return elts
  };

  pp$5.checkUnreserved = function(ref) {
    var start = ref.start;
    var end = ref.end;
    var name = ref.name;

    if (this.inGenerator && name === "yield")
      { this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator"); }
    if (this.inAsync && name === "await")
      { this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function"); }
    if (!(this.currentThisScope().flags & SCOPE_VAR) && name === "arguments")
      { this.raiseRecoverable(start, "Cannot use 'arguments' in class field initializer"); }
    if (this.inClassStaticBlock && (name === "arguments" || name === "await"))
      { this.raise(start, ("Cannot use " + name + " in class static initialization block")); }
    if (this.keywords.test(name))
      { this.raise(start, ("Unexpected keyword '" + name + "'")); }
    if (this.options.ecmaVersion < 6 &&
      this.input.slice(start, end).indexOf("\\") !== -1) { return }
    var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
    if (re.test(name)) {
      if (!this.inAsync && name === "await")
        { this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function"); }
      this.raiseRecoverable(start, ("The keyword '" + name + "' is reserved"));
    }
  };

  // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.

  pp$5.parseIdent = function(liberal) {
    var node = this.parseIdentNode();
    this.next(!!liberal);
    this.finishNode(node, "Identifier");
    if (!liberal) {
      this.checkUnreserved(node);
      if (node.name === "await" && !this.awaitIdentPos)
        { this.awaitIdentPos = node.start; }
    }
    return node
  };

  pp$5.parseIdentNode = function() {
    var node = this.startNode();
    if (this.type === types$1.name) {
      node.name = this.value;
    } else if (this.type.keyword) {
      node.name = this.type.keyword;

      // To fix https://github.com/acornjs/acorn/issues/575
      // `class` and `function` keywords push new context into this.context.
      // But there is no chance to pop the context if the keyword is consumed as an identifier such as a property name.
      // If the previous token is a dot, this does not apply because the context-managing code already ignored the keyword
      if ((node.name === "class" || node.name === "function") &&
        (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
        this.context.pop();
      }
      this.type = types$1.name;
    } else {
      this.unexpected();
    }
    return node
  };

  pp$5.parsePrivateIdent = function() {
    var node = this.startNode();
    if (this.type === types$1.privateId) {
      node.name = this.value;
    } else {
      this.unexpected();
    }
    this.next();
    this.finishNode(node, "PrivateIdentifier");

    // For validating existence
    if (this.options.checkPrivateFields) {
      if (this.privateNameStack.length === 0) {
        this.raise(node.start, ("Private field '#" + (node.name) + "' must be declared in an enclosing class"));
      } else {
        this.privateNameStack[this.privateNameStack.length - 1].used.push(node);
      }
    }

    return node
  };

  // Parses yield expression inside generator.

  pp$5.parseYield = function(forInit) {
    if (!this.yieldPos) { this.yieldPos = this.start; }

    var node = this.startNode();
    this.next();
    if (this.type === types$1.semi || this.canInsertSemicolon() || (this.type !== types$1.star && !this.type.startsExpr)) {
      node.delegate = false;
      node.argument = null;
    } else {
      node.delegate = this.eat(types$1.star);
      node.argument = this.parseMaybeAssign(forInit);
    }
    return this.finishNode(node, "YieldExpression")
  };

  pp$5.parseAwait = function(forInit) {
    if (!this.awaitPos) { this.awaitPos = this.start; }

    var node = this.startNode();
    this.next();
    node.argument = this.parseMaybeUnary(null, true, false, forInit);
    return this.finishNode(node, "AwaitExpression")
  };

  var pp$4 = Parser$1.prototype;

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  pp$4.raise = function(pos, message) {
    var loc = getLineInfo(this.input, pos);
    message += " (" + loc.line + ":" + loc.column + ")";
    if (this.sourceFile) {
      message += " in " + this.sourceFile;
    }
    var err = new SyntaxError(message);
    err.pos = pos; err.loc = loc; err.raisedAt = this.pos;
    throw err
  };

  pp$4.raiseRecoverable = pp$4.raise;

  pp$4.curPosition = function() {
    if (this.options.locations) {
      return new Position(this.curLine, this.pos - this.lineStart)
    }
  };

  var pp$3 = Parser$1.prototype;

  var Scope = function Scope(flags) {
    this.flags = flags;
    // A list of var-declared names in the current lexical scope
    this.var = [];
    // A list of lexically-declared names in the current lexical scope
    this.lexical = [];
    // A list of lexically-declared FunctionDeclaration names in the current lexical scope
    this.functions = [];
  };

  // The functions in this module keep track of declared variables in the current scope in order to detect duplicate variable names.

  pp$3.enterScope = function(flags) {
    this.scopeStack.push(new Scope(flags));
  };

  pp$3.exitScope = function() {
    this.scopeStack.pop();
  };

  // The spec says:
  // > At the top level of a function, or script, function declarations are
  // > treated like var declarations rather than like lexical declarations.
  pp$3.treatFunctionsAsVarInScope = function(scope) {
    return (scope.flags & SCOPE_FUNCTION) || !this.inModule && (scope.flags & SCOPE_TOP)
  };

  pp$3.declareName = function(name, bindingType, pos) {
    var redeclared = false;
    if (bindingType === BIND_LEXICAL) {
      var scope = this.currentScope();
      redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
      scope.lexical.push(name);
      if (this.inModule && (scope.flags & SCOPE_TOP))
        { delete this.undefinedExports[name]; }
    } else if (bindingType === BIND_SIMPLE_CATCH) {
      var scope$1 = this.currentScope();
      scope$1.lexical.push(name);
    } else if (bindingType === BIND_FUNCTION) {
      var scope$2 = this.currentScope();
      if (this.treatFunctionsAsVar)
        { redeclared = scope$2.lexical.indexOf(name) > -1; }
      else
        { redeclared = scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1; }
      scope$2.functions.push(name);
    } else {
      for (var i = this.scopeStack.length - 1; i >= 0; --i) {
        var scope$3 = this.scopeStack[i];
        if (scope$3.lexical.indexOf(name) > -1 && !((scope$3.flags & SCOPE_SIMPLE_CATCH) && scope$3.lexical[0] === name) ||
            !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
          redeclared = true;
          break
        }
        scope$3.var.push(name);
        if (this.inModule && (scope$3.flags & SCOPE_TOP))
          { delete this.undefinedExports[name]; }
        if (scope$3.flags & SCOPE_VAR) { break }
      }
    }
    if (redeclared) { this.raiseRecoverable(pos, ("Identifier '" + name + "' has already been declared")); }
  };

  pp$3.checkLocalExport = function(id) {
    // scope.functions must be empty as Module code is always strict.
    if (this.scopeStack[0].lexical.indexOf(id.name) === -1 &&
        this.scopeStack[0].var.indexOf(id.name) === -1) {
      this.undefinedExports[id.name] = id;
    }
  };

  pp$3.currentScope = function() {
    return this.scopeStack[this.scopeStack.length - 1]
  };

  pp$3.currentVarScope = function() {
    for (var i = this.scopeStack.length - 1;; i--) {
      var scope = this.scopeStack[i];
      if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK)) { return scope }
    }
  };

  // Could be useful for `this`, `new.target`, `super()`, `super.property`, and `super[property]`.
  pp$3.currentThisScope = function() {
    for (var i = this.scopeStack.length - 1;; i--) {
      var scope = this.scopeStack[i];
      if (scope.flags & (SCOPE_VAR | SCOPE_CLASS_FIELD_INIT | SCOPE_CLASS_STATIC_BLOCK) &&
          !(scope.flags & SCOPE_ARROW)) { return scope }
    }
  };

  var Node = function Node(parser, pos, loc) {
    this.type = "";
    this.start = pos;
    this.end = 0;
    if (parser.options.locations)
      { this.loc = new SourceLocation(parser, loc); }
    if (parser.options.directSourceFile)
      { this.sourceFile = parser.options.directSourceFile; }
    if (parser.options.ranges)
      { this.range = [pos, 0]; }
  };

  // Start an AST node, attaching a start offset.

  var pp$2 = Parser$1.prototype;

  pp$2.startNode = function() {
    return new Node(this, this.start, this.startLoc)
  };

  pp$2.startNodeAt = function(pos, loc) {
    return new Node(this, pos, loc)
  };

  // Finish an AST node, adding `type` and `end` properties.

  function finishNodeAt(node, type, pos, loc) {
    node.type = type;
    node.end = pos;
    if (this.options.locations)
      { node.loc.end = loc; }
    if (this.options.ranges)
      { node.range[1] = pos; }
    return node
  }

  pp$2.finishNode = function(node, type) {
    return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
  };

  // Finish node at given position

  pp$2.finishNodeAt = function(node, type, pos, loc) {
    return finishNodeAt.call(this, node, type, pos, loc)
  };

  pp$2.copyNode = function(node) {
    var newNode = new Node(this, node.start, this.startLoc);
    for (var prop in node) { newNode[prop] = node[prop]; }
    return newNode
  };

  // This file was generated by "bin/generate-unicode-script-values.js". Do not modify manually!
  var scriptValuesAddedInUnicode = "Gara Garay Gukh Gurung_Khema Hrkt Katakana_Or_Hiragana Kawi Kirat_Rai Krai Nag_Mundari Nagm Ol_Onal Onao Sunu Sunuwar Todhri Todr Tulu_Tigalari Tutg Unknown Zzzz";

  // This file contains Unicode properties extracted from the ECMAScript specification.
  // The lists are extracted like so:
  // $$('#table-binary-unicode-properties > figure > table > tbody > tr > td:nth-child(1) code').map(el => el.innerText)

  // #table-binary-unicode-properties
  var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
  var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
  var ecma11BinaryProperties = ecma10BinaryProperties;
  var ecma12BinaryProperties = ecma11BinaryProperties + " EBase EComp EMod EPres ExtPict";
  var ecma13BinaryProperties = ecma12BinaryProperties;
  var ecma14BinaryProperties = ecma13BinaryProperties;

  var unicodeBinaryProperties = {
    9: ecma9BinaryProperties,
    10: ecma10BinaryProperties,
    11: ecma11BinaryProperties,
    12: ecma12BinaryProperties,
    13: ecma13BinaryProperties,
    14: ecma14BinaryProperties
  };

  // #table-binary-unicode-properties-of-strings
  var ecma14BinaryPropertiesOfStrings = "Basic_Emoji Emoji_Keycap_Sequence RGI_Emoji_Modifier_Sequence RGI_Emoji_Flag_Sequence RGI_Emoji_Tag_Sequence RGI_Emoji_ZWJ_Sequence RGI_Emoji";

  var unicodeBinaryPropertiesOfStrings = {
    9: "",
    10: "",
    11: "",
    12: "",
    13: "",
    14: ecma14BinaryPropertiesOfStrings
  };

  // #table-unicode-general-category-values
  var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";

  // #table-unicode-script-values
  var ecma9ScriptValues = "Adlam Adlm Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
  var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
  var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
  var ecma12ScriptValues = ecma11ScriptValues + " Chorasmian Chrs Diak Dives_Akuru Khitan_Small_Script Kits Yezi Yezidi";
  var ecma13ScriptValues = ecma12ScriptValues + " Cypro_Minoan Cpmn Old_Uyghur Ougr Tangsa Tnsa Toto Vithkuqi Vith";
  var ecma14ScriptValues = ecma13ScriptValues + " " + scriptValuesAddedInUnicode;

  var unicodeScriptValues = {
    9: ecma9ScriptValues,
    10: ecma10ScriptValues,
    11: ecma11ScriptValues,
    12: ecma12ScriptValues,
    13: ecma13ScriptValues,
    14: ecma14ScriptValues
  };

  var data = {};
  function buildUnicodeData(ecmaVersion) {
    var d = data[ecmaVersion] = {
      binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion] + " " + unicodeGeneralCategoryValues),
      binaryOfStrings: wordsRegexp(unicodeBinaryPropertiesOfStrings[ecmaVersion]),
      nonBinary: {
        General_Category: wordsRegexp(unicodeGeneralCategoryValues),
        Script: wordsRegexp(unicodeScriptValues[ecmaVersion])
      }
    };
    d.nonBinary.Script_Extensions = d.nonBinary.Script;

    d.nonBinary.gc = d.nonBinary.General_Category;
    d.nonBinary.sc = d.nonBinary.Script;
    d.nonBinary.scx = d.nonBinary.Script_Extensions;
  }

  for (var i = 0, list = [9, 10, 11, 12, 13, 14]; i < list.length; i += 1) {
    var ecmaVersion = list[i];

    buildUnicodeData(ecmaVersion);
  }

  var pp$1 = Parser$1.prototype;

  // Track disjunction structure to determine whether a duplicate
  // capture group name is allowed because it is in a separate branch.
  var BranchID = function BranchID(parent, base) {
    // Parent disjunction branch
    this.parent = parent;
    // Identifies this set of sibling branches
    this.base = base || this;
  };

  BranchID.prototype.separatedFrom = function separatedFrom (alt) {
    // A branch is separate from another branch if they or any of
    // their parents are siblings in a given disjunction
    for (var self = this; self; self = self.parent) {
      for (var other = alt; other; other = other.parent) {
        if (self.base === other.base && self !== other) { return true }
      }
    }
    return false
  };

  BranchID.prototype.sibling = function sibling () {
    return new BranchID(this.parent, this.base)
  };

  var RegExpValidationState = function RegExpValidationState(parser) {
    this.parser = parser;
    this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "") + (parser.options.ecmaVersion >= 13 ? "d" : "") + (parser.options.ecmaVersion >= 15 ? "v" : "");
    this.unicodeProperties = data[parser.options.ecmaVersion >= 14 ? 14 : parser.options.ecmaVersion];
    this.source = "";
    this.flags = "";
    this.start = 0;
    this.switchU = false;
    this.switchV = false;
    this.switchN = false;
    this.pos = 0;
    this.lastIntValue = 0;
    this.lastStringValue = "";
    this.lastAssertionIsQuantifiable = false;
    this.numCapturingParens = 0;
    this.maxBackReference = 0;
    this.groupNames = Object.create(null);
    this.backReferenceNames = [];
    this.branchID = null;
  };

  RegExpValidationState.prototype.reset = function reset (start, pattern, flags) {
    var unicodeSets = flags.indexOf("v") !== -1;
    var unicode = flags.indexOf("u") !== -1;
    this.start = start | 0;
    this.source = pattern + "";
    this.flags = flags;
    if (unicodeSets && this.parser.options.ecmaVersion >= 15) {
      this.switchU = true;
      this.switchV = true;
      this.switchN = true;
    } else {
      this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
      this.switchV = false;
      this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
    }
  };

  RegExpValidationState.prototype.raise = function raise (message) {
    this.parser.raiseRecoverable(this.start, ("Invalid regular expression: /" + (this.source) + "/: " + message));
  };

  // If u flag is given, this returns the code point at the index (it combines a surrogate pair).
  // Otherwise, this returns the code unit of the index (can be a part of a surrogate pair).
  RegExpValidationState.prototype.at = function at (i, forceU) {
      if ( forceU === void 0 ) forceU = false;

    var s = this.source;
    var l = s.length;
    if (i >= l) {
      return -1
    }
    var c = s.charCodeAt(i);
    if (!(forceU || this.switchU) || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
      return c
    }
    var next = s.charCodeAt(i + 1);
    return next >= 0xDC00 && next <= 0xDFFF ? (c << 10) + next - 0x35FDC00 : c
  };

  RegExpValidationState.prototype.nextIndex = function nextIndex (i, forceU) {
      if ( forceU === void 0 ) forceU = false;

    var s = this.source;
    var l = s.length;
    if (i >= l) {
      return l
    }
    var c = s.charCodeAt(i), next;
    if (!(forceU || this.switchU) || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l ||
        (next = s.charCodeAt(i + 1)) < 0xDC00 || next > 0xDFFF) {
      return i + 1
    }
    return i + 2
  };

  RegExpValidationState.prototype.current = function current (forceU) {
      if ( forceU === void 0 ) forceU = false;

    return this.at(this.pos, forceU)
  };

  RegExpValidationState.prototype.lookahead = function lookahead (forceU) {
      if ( forceU === void 0 ) forceU = false;

    return this.at(this.nextIndex(this.pos, forceU), forceU)
  };

  RegExpValidationState.prototype.advance = function advance (forceU) {
      if ( forceU === void 0 ) forceU = false;

    this.pos = this.nextIndex(this.pos, forceU);
  };

  RegExpValidationState.prototype.eat = function eat (ch, forceU) {
      if ( forceU === void 0 ) forceU = false;

    if (this.current(forceU) === ch) {
      this.advance(forceU);
      return true
    }
    return false
  };

  RegExpValidationState.prototype.eatChars = function eatChars (chs, forceU) {
      if ( forceU === void 0 ) forceU = false;

    var pos = this.pos;
    for (var i = 0, list = chs; i < list.length; i += 1) {
      var ch = list[i];

        var current = this.at(pos, forceU);
      if (current === -1 || current !== ch) {
        return false
      }
      pos = this.nextIndex(pos, forceU);
    }
    this.pos = pos;
    return true
  };

  /**
   * Validate the flags part of a given RegExpLiteral.
   *
   * @param {RegExpValidationState} state The state to validate RegExp.
   * @returns {void}
   */
  pp$1.validateRegExpFlags = function(state) {
    var validFlags = state.validFlags;
    var flags = state.flags;

    var u = false;
    var v = false;

    for (var i = 0; i < flags.length; i++) {
      var flag = flags.charAt(i);
      if (validFlags.indexOf(flag) === -1) {
        this.raise(state.start, "Invalid regular expression flag");
      }
      if (flags.indexOf(flag, i + 1) > -1) {
        this.raise(state.start, "Duplicate regular expression flag");
      }
      if (flag === "u") { u = true; }
      if (flag === "v") { v = true; }
    }
    if (this.options.ecmaVersion >= 15 && u && v) {
      this.raise(state.start, "Invalid regular expression flag");
    }
  };

  function hasProp(obj) {
    for (var _ in obj) { return true }
    return false
  }

  /**
   * Validate the pattern part of a given RegExpLiteral.
   *
   * @param {RegExpValidationState} state The state to validate RegExp.
   * @returns {void}
   */
  pp$1.validateRegExpPattern = function(state) {
    this.regexp_pattern(state);

    // The goal symbol for the parse is |Pattern[~U, ~N]|. If the result of
    // parsing contains a |GroupName|, reparse with the goal symbol
    // |Pattern[~U, +N]| and use this result instead. Throw a *SyntaxError*
    // exception if _P_ did not conform to the grammar, if any elements of _P_
    // were not matched by the parse, or if any Early Error conditions exist.
    if (!state.switchN && this.options.ecmaVersion >= 9 && hasProp(state.groupNames)) {
      state.switchN = true;
      this.regexp_pattern(state);
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Pattern
  pp$1.regexp_pattern = function(state) {
    state.pos = 0;
    state.lastIntValue = 0;
    state.lastStringValue = "";
    state.lastAssertionIsQuantifiable = false;
    state.numCapturingParens = 0;
    state.maxBackReference = 0;
    state.groupNames = Object.create(null);
    state.backReferenceNames.length = 0;
    state.branchID = null;

    this.regexp_disjunction(state);

    if (state.pos !== state.source.length) {
      // Make the same messages as V8.
      if (state.eat(0x29 /* ) */)) {
        state.raise("Unmatched ')'");
      }
      if (state.eat(0x5D /* ] */) || state.eat(0x7D /* } */)) {
        state.raise("Lone quantifier brackets");
      }
    }
    if (state.maxBackReference > state.numCapturingParens) {
      state.raise("Invalid escape");
    }
    for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
      var name = list[i];

      if (!state.groupNames[name]) {
        state.raise("Invalid named capture referenced");
      }
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Disjunction
  pp$1.regexp_disjunction = function(state) {
    var trackDisjunction = this.options.ecmaVersion >= 16;
    if (trackDisjunction) { state.branchID = new BranchID(state.branchID, null); }
    this.regexp_alternative(state);
    while (state.eat(0x7C /* | */)) {
      if (trackDisjunction) { state.branchID = state.branchID.sibling(); }
      this.regexp_alternative(state);
    }
    if (trackDisjunction) { state.branchID = state.branchID.parent; }

    // Make the same message as V8.
    if (this.regexp_eatQuantifier(state, true)) {
      state.raise("Nothing to repeat");
    }
    if (state.eat(0x7B /* { */)) {
      state.raise("Lone quantifier brackets");
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Alternative
  pp$1.regexp_alternative = function(state) {
    while (state.pos < state.source.length && this.regexp_eatTerm(state)) {}
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Term
  pp$1.regexp_eatTerm = function(state) {
    if (this.regexp_eatAssertion(state)) {
      // Handle `QuantifiableAssertion Quantifier` alternative.
      // `state.lastAssertionIsQuantifiable` is true if the last eaten Assertion
      // is a QuantifiableAssertion.
      if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
        // Make the same message as V8.
        if (state.switchU) {
          state.raise("Invalid quantifier");
        }
      }
      return true
    }

    if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
      this.regexp_eatQuantifier(state);
      return true
    }

    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Assertion
  pp$1.regexp_eatAssertion = function(state) {
    var start = state.pos;
    state.lastAssertionIsQuantifiable = false;

    // ^, $
    if (state.eat(0x5E /* ^ */) || state.eat(0x24 /* $ */)) {
      return true
    }

    // \b \B
    if (state.eat(0x5C /* \ */)) {
      if (state.eat(0x42 /* B */) || state.eat(0x62 /* b */)) {
        return true
      }
      state.pos = start;
    }

    // Lookahead / Lookbehind
    if (state.eat(0x28 /* ( */) && state.eat(0x3F /* ? */)) {
      var lookbehind = false;
      if (this.options.ecmaVersion >= 9) {
        lookbehind = state.eat(0x3C /* < */);
      }
      if (state.eat(0x3D /* = */) || state.eat(0x21 /* ! */)) {
        this.regexp_disjunction(state);
        if (!state.eat(0x29 /* ) */)) {
          state.raise("Unterminated group");
        }
        state.lastAssertionIsQuantifiable = !lookbehind;
        return true
      }
    }

    state.pos = start;
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Quantifier
  pp$1.regexp_eatQuantifier = function(state, noError) {
    if ( noError === void 0 ) noError = false;

    if (this.regexp_eatQuantifierPrefix(state, noError)) {
      state.eat(0x3F /* ? */);
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-QuantifierPrefix
  pp$1.regexp_eatQuantifierPrefix = function(state, noError) {
    return (
      state.eat(0x2A /* * */) ||
      state.eat(0x2B /* + */) ||
      state.eat(0x3F /* ? */) ||
      this.regexp_eatBracedQuantifier(state, noError)
    )
  };
  pp$1.regexp_eatBracedQuantifier = function(state, noError) {
    var start = state.pos;
    if (state.eat(0x7B /* { */)) {
      var min = 0, max = -1;
      if (this.regexp_eatDecimalDigits(state)) {
        min = state.lastIntValue;
        if (state.eat(0x2C /* , */) && this.regexp_eatDecimalDigits(state)) {
          max = state.lastIntValue;
        }
        if (state.eat(0x7D /* } */)) {
          // SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-term
          if (max !== -1 && max < min && !noError) {
            state.raise("numbers out of order in {} quantifier");
          }
          return true
        }
      }
      if (state.switchU && !noError) {
        state.raise("Incomplete quantifier");
      }
      state.pos = start;
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Atom
  pp$1.regexp_eatAtom = function(state) {
    return (
      this.regexp_eatPatternCharacters(state) ||
      state.eat(0x2E /* . */) ||
      this.regexp_eatReverseSolidusAtomEscape(state) ||
      this.regexp_eatCharacterClass(state) ||
      this.regexp_eatUncapturingGroup(state) ||
      this.regexp_eatCapturingGroup(state)
    )
  };
  pp$1.regexp_eatReverseSolidusAtomEscape = function(state) {
    var start = state.pos;
    if (state.eat(0x5C /* \ */)) {
      if (this.regexp_eatAtomEscape(state)) {
        return true
      }
      state.pos = start;
    }
    return false
  };
  pp$1.regexp_eatUncapturingGroup = function(state) {
    var start = state.pos;
    if (state.eat(0x28 /* ( */)) {
      if (state.eat(0x3F /* ? */)) {
        if (this.options.ecmaVersion >= 16) {
          var addModifiers = this.regexp_eatModifiers(state);
          var hasHyphen = state.eat(0x2D /* - */);
          if (addModifiers || hasHyphen) {
            for (var i = 0; i < addModifiers.length; i++) {
              var modifier = addModifiers.charAt(i);
              if (addModifiers.indexOf(modifier, i + 1) > -1) {
                state.raise("Duplicate regular expression modifiers");
              }
            }
            if (hasHyphen) {
              var removeModifiers = this.regexp_eatModifiers(state);
              if (!addModifiers && !removeModifiers && state.current() === 0x3A /* : */) {
                state.raise("Invalid regular expression modifiers");
              }
              for (var i$1 = 0; i$1 < removeModifiers.length; i$1++) {
                var modifier$1 = removeModifiers.charAt(i$1);
                if (
                  removeModifiers.indexOf(modifier$1, i$1 + 1) > -1 ||
                  addModifiers.indexOf(modifier$1) > -1
                ) {
                  state.raise("Duplicate regular expression modifiers");
                }
              }
            }
          }
        }
        if (state.eat(0x3A /* : */)) {
          this.regexp_disjunction(state);
          if (state.eat(0x29 /* ) */)) {
            return true
          }
          state.raise("Unterminated group");
        }
      }
      state.pos = start;
    }
    return false
  };
  pp$1.regexp_eatCapturingGroup = function(state) {
    if (state.eat(0x28 /* ( */)) {
      if (this.options.ecmaVersion >= 9) {
        this.regexp_groupSpecifier(state);
      } else if (state.current() === 0x3F /* ? */) {
        state.raise("Invalid group");
      }
      this.regexp_disjunction(state);
      if (state.eat(0x29 /* ) */)) {
        state.numCapturingParens += 1;
        return true
      }
      state.raise("Unterminated group");
    }
    return false
  };
  // RegularExpressionModifiers ::
  //   [empty]
  //   RegularExpressionModifiers RegularExpressionModifier
  pp$1.regexp_eatModifiers = function(state) {
    var modifiers = "";
    var ch = 0;
    while ((ch = state.current()) !== -1 && isRegularExpressionModifier(ch)) {
      modifiers += codePointToString(ch);
      state.advance();
    }
    return modifiers
  };
  // RegularExpressionModifier :: one of
  //   `i` `m` `s`
  function isRegularExpressionModifier(ch) {
    return ch === 0x69 /* i */ || ch === 0x6d /* m */ || ch === 0x73 /* s */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedAtom
  pp$1.regexp_eatExtendedAtom = function(state) {
    return (
      state.eat(0x2E /* . */) ||
      this.regexp_eatReverseSolidusAtomEscape(state) ||
      this.regexp_eatCharacterClass(state) ||
      this.regexp_eatUncapturingGroup(state) ||
      this.regexp_eatCapturingGroup(state) ||
      this.regexp_eatInvalidBracedQuantifier(state) ||
      this.regexp_eatExtendedPatternCharacter(state)
    )
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-InvalidBracedQuantifier
  pp$1.regexp_eatInvalidBracedQuantifier = function(state) {
    if (this.regexp_eatBracedQuantifier(state, true)) {
      state.raise("Nothing to repeat");
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-SyntaxCharacter
  pp$1.regexp_eatSyntaxCharacter = function(state) {
    var ch = state.current();
    if (isSyntaxCharacter(ch)) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }
    return false
  };
  function isSyntaxCharacter(ch) {
    return (
      ch === 0x24 /* $ */ ||
      ch >= 0x28 /* ( */ && ch <= 0x2B /* + */ ||
      ch === 0x2E /* . */ ||
      ch === 0x3F /* ? */ ||
      ch >= 0x5B /* [ */ && ch <= 0x5E /* ^ */ ||
      ch >= 0x7B /* { */ && ch <= 0x7D /* } */
    )
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-PatternCharacter
  // But eat eager.
  pp$1.regexp_eatPatternCharacters = function(state) {
    var start = state.pos;
    var ch = 0;
    while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
      state.advance();
    }
    return state.pos !== start
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedPatternCharacter
  pp$1.regexp_eatExtendedPatternCharacter = function(state) {
    var ch = state.current();
    if (
      ch !== -1 &&
      ch !== 0x24 /* $ */ &&
      !(ch >= 0x28 /* ( */ && ch <= 0x2B /* + */) &&
      ch !== 0x2E /* . */ &&
      ch !== 0x3F /* ? */ &&
      ch !== 0x5B /* [ */ &&
      ch !== 0x5E /* ^ */ &&
      ch !== 0x7C /* | */
    ) {
      state.advance();
      return true
    }
    return false
  };

  // GroupSpecifier ::
  //   [empty]
  //   `?` GroupName
  pp$1.regexp_groupSpecifier = function(state) {
    if (state.eat(0x3F /* ? */)) {
      if (!this.regexp_eatGroupName(state)) { state.raise("Invalid group"); }
      var trackDisjunction = this.options.ecmaVersion >= 16;
      var known = state.groupNames[state.lastStringValue];
      if (known) {
        if (trackDisjunction) {
          for (var i = 0, list = known; i < list.length; i += 1) {
            var altID = list[i];

            if (!altID.separatedFrom(state.branchID))
              { state.raise("Duplicate capture group name"); }
          }
        } else {
          state.raise("Duplicate capture group name");
        }
      }
      if (trackDisjunction) {
        (known || (state.groupNames[state.lastStringValue] = [])).push(state.branchID);
      } else {
        state.groupNames[state.lastStringValue] = true;
      }
    }
  };

  // GroupName ::
  //   `<` RegExpIdentifierName `>`
  // Note: this updates `state.lastStringValue` property with the eaten name.
  pp$1.regexp_eatGroupName = function(state) {
    state.lastStringValue = "";
    if (state.eat(0x3C /* < */)) {
      if (this.regexp_eatRegExpIdentifierName(state) && state.eat(0x3E /* > */)) {
        return true
      }
      state.raise("Invalid capture group name");
    }
    return false
  };

  // RegExpIdentifierName ::
  //   RegExpIdentifierStart
  //   RegExpIdentifierName RegExpIdentifierPart
  // Note: this updates `state.lastStringValue` property with the eaten name.
  pp$1.regexp_eatRegExpIdentifierName = function(state) {
    state.lastStringValue = "";
    if (this.regexp_eatRegExpIdentifierStart(state)) {
      state.lastStringValue += codePointToString(state.lastIntValue);
      while (this.regexp_eatRegExpIdentifierPart(state)) {
        state.lastStringValue += codePointToString(state.lastIntValue);
      }
      return true
    }
    return false
  };

  // RegExpIdentifierStart ::
  //   UnicodeIDStart
  //   `$`
  //   `_`
  //   `\` RegExpUnicodeEscapeSequence[+U]
  pp$1.regexp_eatRegExpIdentifierStart = function(state) {
    var start = state.pos;
    var forceU = this.options.ecmaVersion >= 11;
    var ch = state.current(forceU);
    state.advance(forceU);

    if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
      ch = state.lastIntValue;
    }
    if (isRegExpIdentifierStart(ch)) {
      state.lastIntValue = ch;
      return true
    }

    state.pos = start;
    return false
  };
  function isRegExpIdentifierStart(ch) {
    return isIdentifierStart(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */
  }

  // RegExpIdentifierPart ::
  //   UnicodeIDContinue
  //   `$`
  //   `_`
  //   `\` RegExpUnicodeEscapeSequence[+U]
  //   <ZWNJ>
  //   <ZWJ>
  pp$1.regexp_eatRegExpIdentifierPart = function(state) {
    var start = state.pos;
    var forceU = this.options.ecmaVersion >= 11;
    var ch = state.current(forceU);
    state.advance(forceU);

    if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state, forceU)) {
      ch = state.lastIntValue;
    }
    if (isRegExpIdentifierPart(ch)) {
      state.lastIntValue = ch;
      return true
    }

    state.pos = start;
    return false
  };
  function isRegExpIdentifierPart(ch) {
    return isIdentifierChar(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */ || ch === 0x200C /* <ZWNJ> */ || ch === 0x200D /* <ZWJ> */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-AtomEscape
  pp$1.regexp_eatAtomEscape = function(state) {
    if (
      this.regexp_eatBackReference(state) ||
      this.regexp_eatCharacterClassEscape(state) ||
      this.regexp_eatCharacterEscape(state) ||
      (state.switchN && this.regexp_eatKGroupName(state))
    ) {
      return true
    }
    if (state.switchU) {
      // Make the same message as V8.
      if (state.current() === 0x63 /* c */) {
        state.raise("Invalid unicode escape");
      }
      state.raise("Invalid escape");
    }
    return false
  };
  pp$1.regexp_eatBackReference = function(state) {
    var start = state.pos;
    if (this.regexp_eatDecimalEscape(state)) {
      var n = state.lastIntValue;
      if (state.switchU) {
        // For SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-atomescape
        if (n > state.maxBackReference) {
          state.maxBackReference = n;
        }
        return true
      }
      if (n <= state.numCapturingParens) {
        return true
      }
      state.pos = start;
    }
    return false
  };
  pp$1.regexp_eatKGroupName = function(state) {
    if (state.eat(0x6B /* k */)) {
      if (this.regexp_eatGroupName(state)) {
        state.backReferenceNames.push(state.lastStringValue);
        return true
      }
      state.raise("Invalid named reference");
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-CharacterEscape
  pp$1.regexp_eatCharacterEscape = function(state) {
    return (
      this.regexp_eatControlEscape(state) ||
      this.regexp_eatCControlLetter(state) ||
      this.regexp_eatZero(state) ||
      this.regexp_eatHexEscapeSequence(state) ||
      this.regexp_eatRegExpUnicodeEscapeSequence(state, false) ||
      (!state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state)) ||
      this.regexp_eatIdentityEscape(state)
    )
  };
  pp$1.regexp_eatCControlLetter = function(state) {
    var start = state.pos;
    if (state.eat(0x63 /* c */)) {
      if (this.regexp_eatControlLetter(state)) {
        return true
      }
      state.pos = start;
    }
    return false
  };
  pp$1.regexp_eatZero = function(state) {
    if (state.current() === 0x30 /* 0 */ && !isDecimalDigit(state.lookahead())) {
      state.lastIntValue = 0;
      state.advance();
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-ControlEscape
  pp$1.regexp_eatControlEscape = function(state) {
    var ch = state.current();
    if (ch === 0x74 /* t */) {
      state.lastIntValue = 0x09; /* \t */
      state.advance();
      return true
    }
    if (ch === 0x6E /* n */) {
      state.lastIntValue = 0x0A; /* \n */
      state.advance();
      return true
    }
    if (ch === 0x76 /* v */) {
      state.lastIntValue = 0x0B; /* \v */
      state.advance();
      return true
    }
    if (ch === 0x66 /* f */) {
      state.lastIntValue = 0x0C; /* \f */
      state.advance();
      return true
    }
    if (ch === 0x72 /* r */) {
      state.lastIntValue = 0x0D; /* \r */
      state.advance();
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-ControlLetter
  pp$1.regexp_eatControlLetter = function(state) {
    var ch = state.current();
    if (isControlLetter(ch)) {
      state.lastIntValue = ch % 0x20;
      state.advance();
      return true
    }
    return false
  };
  function isControlLetter(ch) {
    return (
      (ch >= 0x41 /* A */ && ch <= 0x5A /* Z */) ||
      (ch >= 0x61 /* a */ && ch <= 0x7A /* z */)
    )
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-RegExpUnicodeEscapeSequence
  pp$1.regexp_eatRegExpUnicodeEscapeSequence = function(state, forceU) {
    if ( forceU === void 0 ) forceU = false;

    var start = state.pos;
    var switchU = forceU || state.switchU;

    if (state.eat(0x75 /* u */)) {
      if (this.regexp_eatFixedHexDigits(state, 4)) {
        var lead = state.lastIntValue;
        if (switchU && lead >= 0xD800 && lead <= 0xDBFF) {
          var leadSurrogateEnd = state.pos;
          if (state.eat(0x5C /* \ */) && state.eat(0x75 /* u */) && this.regexp_eatFixedHexDigits(state, 4)) {
            var trail = state.lastIntValue;
            if (trail >= 0xDC00 && trail <= 0xDFFF) {
              state.lastIntValue = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
              return true
            }
          }
          state.pos = leadSurrogateEnd;
          state.lastIntValue = lead;
        }
        return true
      }
      if (
        switchU &&
        state.eat(0x7B /* { */) &&
        this.regexp_eatHexDigits(state) &&
        state.eat(0x7D /* } */) &&
        isValidUnicode(state.lastIntValue)
      ) {
        return true
      }
      if (switchU) {
        state.raise("Invalid unicode escape");
      }
      state.pos = start;
    }

    return false
  };
  function isValidUnicode(ch) {
    return ch >= 0 && ch <= 0x10FFFF
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-IdentityEscape
  pp$1.regexp_eatIdentityEscape = function(state) {
    if (state.switchU) {
      if (this.regexp_eatSyntaxCharacter(state)) {
        return true
      }
      if (state.eat(0x2F /* / */)) {
        state.lastIntValue = 0x2F; /* / */
        return true
      }
      return false
    }

    var ch = state.current();
    if (ch !== 0x63 /* c */ && (!state.switchN || ch !== 0x6B /* k */)) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }

    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape
  pp$1.regexp_eatDecimalEscape = function(state) {
    state.lastIntValue = 0;
    var ch = state.current();
    if (ch >= 0x31 /* 1 */ && ch <= 0x39 /* 9 */) {
      do {
        state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
        state.advance();
      } while ((ch = state.current()) >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */)
      return true
    }
    return false
  };

  // Return values used by character set parsing methods, needed to
  // forbid negation of sets that can match strings.
  var CharSetNone = 0; // Nothing parsed
  var CharSetOk = 1; // Construct parsed, cannot contain strings
  var CharSetString = 2; // Construct parsed, can contain strings

  // https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClassEscape
  pp$1.regexp_eatCharacterClassEscape = function(state) {
    var ch = state.current();

    if (isCharacterClassEscape(ch)) {
      state.lastIntValue = -1;
      state.advance();
      return CharSetOk
    }

    var negate = false;
    if (
      state.switchU &&
      this.options.ecmaVersion >= 9 &&
      ((negate = ch === 0x50 /* P */) || ch === 0x70 /* p */)
    ) {
      state.lastIntValue = -1;
      state.advance();
      var result;
      if (
        state.eat(0x7B /* { */) &&
        (result = this.regexp_eatUnicodePropertyValueExpression(state)) &&
        state.eat(0x7D /* } */)
      ) {
        if (negate && result === CharSetString) { state.raise("Invalid property name"); }
        return result
      }
      state.raise("Invalid property name");
    }

    return CharSetNone
  };

  function isCharacterClassEscape(ch) {
    return (
      ch === 0x64 /* d */ ||
      ch === 0x44 /* D */ ||
      ch === 0x73 /* s */ ||
      ch === 0x53 /* S */ ||
      ch === 0x77 /* w */ ||
      ch === 0x57 /* W */
    )
  }

  // UnicodePropertyValueExpression ::
  //   UnicodePropertyName `=` UnicodePropertyValue
  //   LoneUnicodePropertyNameOrValue
  pp$1.regexp_eatUnicodePropertyValueExpression = function(state) {
    var start = state.pos;

    // UnicodePropertyName `=` UnicodePropertyValue
    if (this.regexp_eatUnicodePropertyName(state) && state.eat(0x3D /* = */)) {
      var name = state.lastStringValue;
      if (this.regexp_eatUnicodePropertyValue(state)) {
        var value = state.lastStringValue;
        this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
        return CharSetOk
      }
    }
    state.pos = start;

    // LoneUnicodePropertyNameOrValue
    if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
      var nameOrValue = state.lastStringValue;
      return this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue)
    }
    return CharSetNone
  };

  pp$1.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
    if (!hasOwn(state.unicodeProperties.nonBinary, name))
      { state.raise("Invalid property name"); }
    if (!state.unicodeProperties.nonBinary[name].test(value))
      { state.raise("Invalid property value"); }
  };

  pp$1.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
    if (state.unicodeProperties.binary.test(nameOrValue)) { return CharSetOk }
    if (state.switchV && state.unicodeProperties.binaryOfStrings.test(nameOrValue)) { return CharSetString }
    state.raise("Invalid property name");
  };

  // UnicodePropertyName ::
  //   UnicodePropertyNameCharacters
  pp$1.regexp_eatUnicodePropertyName = function(state) {
    var ch = 0;
    state.lastStringValue = "";
    while (isUnicodePropertyNameCharacter(ch = state.current())) {
      state.lastStringValue += codePointToString(ch);
      state.advance();
    }
    return state.lastStringValue !== ""
  };

  function isUnicodePropertyNameCharacter(ch) {
    return isControlLetter(ch) || ch === 0x5F /* _ */
  }

  // UnicodePropertyValue ::
  //   UnicodePropertyValueCharacters
  pp$1.regexp_eatUnicodePropertyValue = function(state) {
    var ch = 0;
    state.lastStringValue = "";
    while (isUnicodePropertyValueCharacter(ch = state.current())) {
      state.lastStringValue += codePointToString(ch);
      state.advance();
    }
    return state.lastStringValue !== ""
  };
  function isUnicodePropertyValueCharacter(ch) {
    return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch)
  }

  // LoneUnicodePropertyNameOrValue ::
  //   UnicodePropertyValueCharacters
  pp$1.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
    return this.regexp_eatUnicodePropertyValue(state)
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClass
  pp$1.regexp_eatCharacterClass = function(state) {
    if (state.eat(0x5B /* [ */)) {
      var negate = state.eat(0x5E /* ^ */);
      var result = this.regexp_classContents(state);
      if (!state.eat(0x5D /* ] */))
        { state.raise("Unterminated character class"); }
      if (negate && result === CharSetString)
        { state.raise("Negated character class may contain strings"); }
      return true
    }
    return false
  };

  // https://tc39.es/ecma262/#prod-ClassContents
  // https://www.ecma-international.org/ecma-262/8.0/#prod-ClassRanges
  pp$1.regexp_classContents = function(state) {
    if (state.current() === 0x5D /* ] */) { return CharSetOk }
    if (state.switchV) { return this.regexp_classSetExpression(state) }
    this.regexp_nonEmptyClassRanges(state);
    return CharSetOk
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRanges
  // https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRangesNoDash
  pp$1.regexp_nonEmptyClassRanges = function(state) {
    while (this.regexp_eatClassAtom(state)) {
      var left = state.lastIntValue;
      if (state.eat(0x2D /* - */) && this.regexp_eatClassAtom(state)) {
        var right = state.lastIntValue;
        if (state.switchU && (left === -1 || right === -1)) {
          state.raise("Invalid character class");
        }
        if (left !== -1 && right !== -1 && left > right) {
          state.raise("Range out of order in character class");
        }
      }
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtom
  // https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtomNoDash
  pp$1.regexp_eatClassAtom = function(state) {
    var start = state.pos;

    if (state.eat(0x5C /* \ */)) {
      if (this.regexp_eatClassEscape(state)) {
        return true
      }
      if (state.switchU) {
        // Make the same message as V8.
        var ch$1 = state.current();
        if (ch$1 === 0x63 /* c */ || isOctalDigit(ch$1)) {
          state.raise("Invalid class escape");
        }
        state.raise("Invalid escape");
      }
      state.pos = start;
    }

    var ch = state.current();
    if (ch !== 0x5D /* ] */) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }

    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassEscape
  pp$1.regexp_eatClassEscape = function(state) {
    var start = state.pos;

    if (state.eat(0x62 /* b */)) {
      state.lastIntValue = 0x08; /* <BS> */
      return true
    }

    if (state.switchU && state.eat(0x2D /* - */)) {
      state.lastIntValue = 0x2D; /* - */
      return true
    }

    if (!state.switchU && state.eat(0x63 /* c */)) {
      if (this.regexp_eatClassControlLetter(state)) {
        return true
      }
      state.pos = start;
    }

    return (
      this.regexp_eatCharacterClassEscape(state) ||
      this.regexp_eatCharacterEscape(state)
    )
  };

  // https://tc39.es/ecma262/#prod-ClassSetExpression
  // https://tc39.es/ecma262/#prod-ClassUnion
  // https://tc39.es/ecma262/#prod-ClassIntersection
  // https://tc39.es/ecma262/#prod-ClassSubtraction
  pp$1.regexp_classSetExpression = function(state) {
    var result = CharSetOk, subResult;
    if (this.regexp_eatClassSetRange(state)) ; else if (subResult = this.regexp_eatClassSetOperand(state)) {
      if (subResult === CharSetString) { result = CharSetString; }
      // https://tc39.es/ecma262/#prod-ClassIntersection
      var start = state.pos;
      while (state.eatChars([0x26, 0x26] /* && */)) {
        if (
          state.current() !== 0x26 /* & */ &&
          (subResult = this.regexp_eatClassSetOperand(state))
        ) {
          if (subResult !== CharSetString) { result = CharSetOk; }
          continue
        }
        state.raise("Invalid character in character class");
      }
      if (start !== state.pos) { return result }
      // https://tc39.es/ecma262/#prod-ClassSubtraction
      while (state.eatChars([0x2D, 0x2D] /* -- */)) {
        if (this.regexp_eatClassSetOperand(state)) { continue }
        state.raise("Invalid character in character class");
      }
      if (start !== state.pos) { return result }
    } else {
      state.raise("Invalid character in character class");
    }
    // https://tc39.es/ecma262/#prod-ClassUnion
    for (;;) {
      if (this.regexp_eatClassSetRange(state)) { continue }
      subResult = this.regexp_eatClassSetOperand(state);
      if (!subResult) { return result }
      if (subResult === CharSetString) { result = CharSetString; }
    }
  };

  // https://tc39.es/ecma262/#prod-ClassSetRange
  pp$1.regexp_eatClassSetRange = function(state) {
    var start = state.pos;
    if (this.regexp_eatClassSetCharacter(state)) {
      var left = state.lastIntValue;
      if (state.eat(0x2D /* - */) && this.regexp_eatClassSetCharacter(state)) {
        var right = state.lastIntValue;
        if (left !== -1 && right !== -1 && left > right) {
          state.raise("Range out of order in character class");
        }
        return true
      }
      state.pos = start;
    }
    return false
  };

  // https://tc39.es/ecma262/#prod-ClassSetOperand
  pp$1.regexp_eatClassSetOperand = function(state) {
    if (this.regexp_eatClassSetCharacter(state)) { return CharSetOk }
    return this.regexp_eatClassStringDisjunction(state) || this.regexp_eatNestedClass(state)
  };

  // https://tc39.es/ecma262/#prod-NestedClass
  pp$1.regexp_eatNestedClass = function(state) {
    var start = state.pos;
    if (state.eat(0x5B /* [ */)) {
      var negate = state.eat(0x5E /* ^ */);
      var result = this.regexp_classContents(state);
      if (state.eat(0x5D /* ] */)) {
        if (negate && result === CharSetString) {
          state.raise("Negated character class may contain strings");
        }
        return result
      }
      state.pos = start;
    }
    if (state.eat(0x5C /* \ */)) {
      var result$1 = this.regexp_eatCharacterClassEscape(state);
      if (result$1) {
        return result$1
      }
      state.pos = start;
    }
    return null
  };

  // https://tc39.es/ecma262/#prod-ClassStringDisjunction
  pp$1.regexp_eatClassStringDisjunction = function(state) {
    var start = state.pos;
    if (state.eatChars([0x5C, 0x71] /* \q */)) {
      if (state.eat(0x7B /* { */)) {
        var result = this.regexp_classStringDisjunctionContents(state);
        if (state.eat(0x7D /* } */)) {
          return result
        }
      } else {
        // Make the same message as V8.
        state.raise("Invalid escape");
      }
      state.pos = start;
    }
    return null
  };

  // https://tc39.es/ecma262/#prod-ClassStringDisjunctionContents
  pp$1.regexp_classStringDisjunctionContents = function(state) {
    var result = this.regexp_classString(state);
    while (state.eat(0x7C /* | */)) {
      if (this.regexp_classString(state) === CharSetString) { result = CharSetString; }
    }
    return result
  };

  // https://tc39.es/ecma262/#prod-ClassString
  // https://tc39.es/ecma262/#prod-NonEmptyClassString
  pp$1.regexp_classString = function(state) {
    var count = 0;
    while (this.regexp_eatClassSetCharacter(state)) { count++; }
    return count === 1 ? CharSetOk : CharSetString
  };

  // https://tc39.es/ecma262/#prod-ClassSetCharacter
  pp$1.regexp_eatClassSetCharacter = function(state) {
    var start = state.pos;
    if (state.eat(0x5C /* \ */)) {
      if (
        this.regexp_eatCharacterEscape(state) ||
        this.regexp_eatClassSetReservedPunctuator(state)
      ) {
        return true
      }
      if (state.eat(0x62 /* b */)) {
        state.lastIntValue = 0x08; /* <BS> */
        return true
      }
      state.pos = start;
      return false
    }
    var ch = state.current();
    if (ch < 0 || ch === state.lookahead() && isClassSetReservedDoublePunctuatorCharacter(ch)) { return false }
    if (isClassSetSyntaxCharacter(ch)) { return false }
    state.advance();
    state.lastIntValue = ch;
    return true
  };

  // https://tc39.es/ecma262/#prod-ClassSetReservedDoublePunctuator
  function isClassSetReservedDoublePunctuatorCharacter(ch) {
    return (
      ch === 0x21 /* ! */ ||
      ch >= 0x23 /* # */ && ch <= 0x26 /* & */ ||
      ch >= 0x2A /* * */ && ch <= 0x2C /* , */ ||
      ch === 0x2E /* . */ ||
      ch >= 0x3A /* : */ && ch <= 0x40 /* @ */ ||
      ch === 0x5E /* ^ */ ||
      ch === 0x60 /* ` */ ||
      ch === 0x7E /* ~ */
    )
  }

  // https://tc39.es/ecma262/#prod-ClassSetSyntaxCharacter
  function isClassSetSyntaxCharacter(ch) {
    return (
      ch === 0x28 /* ( */ ||
      ch === 0x29 /* ) */ ||
      ch === 0x2D /* - */ ||
      ch === 0x2F /* / */ ||
      ch >= 0x5B /* [ */ && ch <= 0x5D /* ] */ ||
      ch >= 0x7B /* { */ && ch <= 0x7D /* } */
    )
  }

  // https://tc39.es/ecma262/#prod-ClassSetReservedPunctuator
  pp$1.regexp_eatClassSetReservedPunctuator = function(state) {
    var ch = state.current();
    if (isClassSetReservedPunctuator(ch)) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }
    return false
  };

  // https://tc39.es/ecma262/#prod-ClassSetReservedPunctuator
  function isClassSetReservedPunctuator(ch) {
    return (
      ch === 0x21 /* ! */ ||
      ch === 0x23 /* # */ ||
      ch === 0x25 /* % */ ||
      ch === 0x26 /* & */ ||
      ch === 0x2C /* , */ ||
      ch === 0x2D /* - */ ||
      ch >= 0x3A /* : */ && ch <= 0x3E /* > */ ||
      ch === 0x40 /* @ */ ||
      ch === 0x60 /* ` */ ||
      ch === 0x7E /* ~ */
    )
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassControlLetter
  pp$1.regexp_eatClassControlLetter = function(state) {
    var ch = state.current();
    if (isDecimalDigit(ch) || ch === 0x5F /* _ */) {
      state.lastIntValue = ch % 0x20;
      state.advance();
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
  pp$1.regexp_eatHexEscapeSequence = function(state) {
    var start = state.pos;
    if (state.eat(0x78 /* x */)) {
      if (this.regexp_eatFixedHexDigits(state, 2)) {
        return true
      }
      if (state.switchU) {
        state.raise("Invalid escape");
      }
      state.pos = start;
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalDigits
  pp$1.regexp_eatDecimalDigits = function(state) {
    var start = state.pos;
    var ch = 0;
    state.lastIntValue = 0;
    while (isDecimalDigit(ch = state.current())) {
      state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
      state.advance();
    }
    return state.pos !== start
  };
  function isDecimalDigit(ch) {
    return ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigits
  pp$1.regexp_eatHexDigits = function(state) {
    var start = state.pos;
    var ch = 0;
    state.lastIntValue = 0;
    while (isHexDigit(ch = state.current())) {
      state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
      state.advance();
    }
    return state.pos !== start
  };
  function isHexDigit(ch) {
    return (
      (ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */) ||
      (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) ||
      (ch >= 0x61 /* a */ && ch <= 0x66 /* f */)
    )
  }
  function hexToInt(ch) {
    if (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) {
      return 10 + (ch - 0x41 /* A */)
    }
    if (ch >= 0x61 /* a */ && ch <= 0x66 /* f */) {
      return 10 + (ch - 0x61 /* a */)
    }
    return ch - 0x30 /* 0 */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-LegacyOctalEscapeSequence
  // Allows only 0-377(octal) i.e. 0-255(decimal).
  pp$1.regexp_eatLegacyOctalEscapeSequence = function(state) {
    if (this.regexp_eatOctalDigit(state)) {
      var n1 = state.lastIntValue;
      if (this.regexp_eatOctalDigit(state)) {
        var n2 = state.lastIntValue;
        if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
          state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
        } else {
          state.lastIntValue = n1 * 8 + n2;
        }
      } else {
        state.lastIntValue = n1;
      }
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-OctalDigit
  pp$1.regexp_eatOctalDigit = function(state) {
    var ch = state.current();
    if (isOctalDigit(ch)) {
      state.lastIntValue = ch - 0x30; /* 0 */
      state.advance();
      return true
    }
    state.lastIntValue = 0;
    return false
  };
  function isOctalDigit(ch) {
    return ch >= 0x30 /* 0 */ && ch <= 0x37 /* 7 */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Hex4Digits
  // https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigit
  // And HexDigit HexDigit in https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
  pp$1.regexp_eatFixedHexDigits = function(state, length) {
    var start = state.pos;
    state.lastIntValue = 0;
    for (var i = 0; i < length; ++i) {
      var ch = state.current();
      if (!isHexDigit(ch)) {
        state.pos = start;
        return false
      }
      state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
      state.advance();
    }
    return true
  };

  // Object type used to represent tokens. Note that normally, tokens
  // simply exist as properties on the parser object. This is only
  // used for the onToken callback and the external tokenizer.

  var Token$1 = function Token(p) {
    this.type = p.type;
    this.value = p.value;
    this.start = p.start;
    this.end = p.end;
    if (p.options.locations)
      { this.loc = new SourceLocation(p, p.startLoc, p.endLoc); }
    if (p.options.ranges)
      { this.range = [p.start, p.end]; }
  };

  // ## Tokenizer

  var pp = Parser$1.prototype;

  // Move to the next token

  pp.next = function(ignoreEscapeSequenceInKeyword) {
    if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc)
      { this.raiseRecoverable(this.start, "Escape sequence in keyword " + this.type.keyword); }
    if (this.options.onToken)
      { this.options.onToken(new Token$1(this)); }

    this.lastTokEnd = this.end;
    this.lastTokStart = this.start;
    this.lastTokEndLoc = this.endLoc;
    this.lastTokStartLoc = this.startLoc;
    this.nextToken();
  };

  pp.getToken = function() {
    this.next();
    return new Token$1(this)
  };

  // If we're in an ES6 environment, make parsers iterable
  if (typeof Symbol !== "undefined")
    { pp[Symbol.iterator] = function() {
      var this$1$1 = this;

      return {
        next: function () {
          var token = this$1$1.getToken();
          return {
            done: token.type === types$1.eof,
            value: token
          }
        }
      }
    }; }

  // Toggle strict mode. Re-reads the next number or string to please
  // pedantic tests (`"use strict"; 010;` should fail).

  // Read a single token, updating the parser object's token-related
  // properties.

  pp.nextToken = function() {
    var curContext = this.curContext();
    if (!curContext || !curContext.preserveSpace) { this.skipSpace(); }

    this.start = this.pos;
    if (this.options.locations) { this.startLoc = this.curPosition(); }
    if (this.pos >= this.input.length) { return this.finishToken(types$1.eof) }

    if (curContext.override) { return curContext.override(this) }
    else { this.readToken(this.fullCharCodeAtPos()); }
  };

  pp.readToken = function(code) {
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
      { return this.readWord() }

    return this.getTokenFromCode(code)
  };

  pp.fullCharCodeAtPos = function() {
    var code = this.input.charCodeAt(this.pos);
    if (code <= 0xd7ff || code >= 0xdc00) { return code }
    var next = this.input.charCodeAt(this.pos + 1);
    return next <= 0xdbff || next >= 0xe000 ? code : (code << 10) + next - 0x35fdc00
  };

  pp.skipBlockComment = function() {
    var startLoc = this.options.onComment && this.curPosition();
    var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
    if (end === -1) { this.raise(this.pos - 2, "Unterminated comment"); }
    this.pos = end + 2;
    if (this.options.locations) {
      for (var nextBreak = (void 0), pos = start; (nextBreak = nextLineBreak(this.input, pos, this.pos)) > -1;) {
        ++this.curLine;
        pos = this.lineStart = nextBreak;
      }
    }
    if (this.options.onComment)
      { this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                             startLoc, this.curPosition()); }
  };

  pp.skipLineComment = function(startSkip) {
    var start = this.pos;
    var startLoc = this.options.onComment && this.curPosition();
    var ch = this.input.charCodeAt(this.pos += startSkip);
    while (this.pos < this.input.length && !isNewLine(ch)) {
      ch = this.input.charCodeAt(++this.pos);
    }
    if (this.options.onComment)
      { this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                             startLoc, this.curPosition()); }
  };

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  pp.skipSpace = function() {
    loop: while (this.pos < this.input.length) {
      var ch = this.input.charCodeAt(this.pos);
      switch (ch) {
      case 32: case 160: // ' '
        ++this.pos;
        break
      case 13:
        if (this.input.charCodeAt(this.pos + 1) === 10) {
          ++this.pos;
        }
      case 10: case 8232: case 8233:
        ++this.pos;
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        break
      case 47: // '/'
        switch (this.input.charCodeAt(this.pos + 1)) {
        case 42: // '*'
          this.skipBlockComment();
          break
        case 47:
          this.skipLineComment(2);
          break
        default:
          break loop
        }
        break
      default:
        if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
          ++this.pos;
        } else {
          break loop
        }
      }
    }
  };

  // Called at the end of every token. Sets `end`, `val`, and
  // maintains `context` and `exprAllowed`, and skips the space after
  // the token, so that the next one's `start` will point at the
  // right position.

  pp.finishToken = function(type, val) {
    this.end = this.pos;
    if (this.options.locations) { this.endLoc = this.curPosition(); }
    var prevType = this.type;
    this.type = type;
    this.value = val;

    this.updateContext(prevType);
  };

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  pp.readToken_dot = function() {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next >= 48 && next <= 57) { return this.readNumber(true) }
    var next2 = this.input.charCodeAt(this.pos + 2);
    if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
      this.pos += 3;
      return this.finishToken(types$1.ellipsis)
    } else {
      ++this.pos;
      return this.finishToken(types$1.dot)
    }
  };

  pp.readToken_slash = function() { // '/'
    var next = this.input.charCodeAt(this.pos + 1);
    if (this.exprAllowed) { ++this.pos; return this.readRegexp() }
    if (next === 61) { return this.finishOp(types$1.assign, 2) }
    return this.finishOp(types$1.slash, 1)
  };

  pp.readToken_mult_modulo_exp = function(code) { // '%*'
    var next = this.input.charCodeAt(this.pos + 1);
    var size = 1;
    var tokentype = code === 42 ? types$1.star : types$1.modulo;

    // exponentiation operator ** and **=
    if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
      ++size;
      tokentype = types$1.starstar;
      next = this.input.charCodeAt(this.pos + 2);
    }

    if (next === 61) { return this.finishOp(types$1.assign, size + 1) }
    return this.finishOp(tokentype, size)
  };

  pp.readToken_pipe_amp = function(code) { // '|&'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === code) {
      if (this.options.ecmaVersion >= 12) {
        var next2 = this.input.charCodeAt(this.pos + 2);
        if (next2 === 61) { return this.finishOp(types$1.assign, 3) }
      }
      return this.finishOp(code === 124 ? types$1.logicalOR : types$1.logicalAND, 2)
    }
    if (next === 61) { return this.finishOp(types$1.assign, 2) }
    return this.finishOp(code === 124 ? types$1.bitwiseOR : types$1.bitwiseAND, 1)
  };

  pp.readToken_caret = function() { // '^'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 61) { return this.finishOp(types$1.assign, 2) }
    return this.finishOp(types$1.bitwiseXOR, 1)
  };

  pp.readToken_plus_min = function(code) { // '+-'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === code) {
      if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 &&
          (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
        // A `-->` line comment
        this.skipLineComment(3);
        this.skipSpace();
        return this.nextToken()
      }
      return this.finishOp(types$1.incDec, 2)
    }
    if (next === 61) { return this.finishOp(types$1.assign, 2) }
    return this.finishOp(types$1.plusMin, 1)
  };

  pp.readToken_lt_gt = function(code) { // '<>'
    var next = this.input.charCodeAt(this.pos + 1);
    var size = 1;
    if (next === code) {
      size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
      if (this.input.charCodeAt(this.pos + size) === 61) { return this.finishOp(types$1.assign, size + 1) }
      return this.finishOp(types$1.bitShift, size)
    }
    if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 &&
        this.input.charCodeAt(this.pos + 3) === 45) {
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      this.skipLineComment(4);
      this.skipSpace();
      return this.nextToken()
    }
    if (next === 61) { size = 2; }
    return this.finishOp(types$1.relational, size)
  };

  pp.readToken_eq_excl = function(code) { // '=!'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 61) { return this.finishOp(types$1.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2) }
    if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
      this.pos += 2;
      return this.finishToken(types$1.arrow)
    }
    return this.finishOp(code === 61 ? types$1.eq : types$1.prefix, 1)
  };

  pp.readToken_question = function() { // '?'
    var ecmaVersion = this.options.ecmaVersion;
    if (ecmaVersion >= 11) {
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 46) {
        var next2 = this.input.charCodeAt(this.pos + 2);
        if (next2 < 48 || next2 > 57) { return this.finishOp(types$1.questionDot, 2) }
      }
      if (next === 63) {
        if (ecmaVersion >= 12) {
          var next2$1 = this.input.charCodeAt(this.pos + 2);
          if (next2$1 === 61) { return this.finishOp(types$1.assign, 3) }
        }
        return this.finishOp(types$1.coalesce, 2)
      }
    }
    return this.finishOp(types$1.question, 1)
  };

  pp.readToken_numberSign = function() { // '#'
    var ecmaVersion = this.options.ecmaVersion;
    var code = 35; // '#'
    if (ecmaVersion >= 13) {
      ++this.pos;
      code = this.fullCharCodeAtPos();
      if (isIdentifierStart(code, true) || code === 92 /* '\' */) {
        return this.finishToken(types$1.privateId, this.readWord1())
      }
    }

    this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
  };

  pp.getTokenFromCode = function(code) {
    switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
    case 46: // '.'
      return this.readToken_dot()

    // Punctuation tokens.
    case 40: ++this.pos; return this.finishToken(types$1.parenL)
    case 41: ++this.pos; return this.finishToken(types$1.parenR)
    case 59: ++this.pos; return this.finishToken(types$1.semi)
    case 44: ++this.pos; return this.finishToken(types$1.comma)
    case 91: ++this.pos; return this.finishToken(types$1.bracketL)
    case 93: ++this.pos; return this.finishToken(types$1.bracketR)
    case 123: ++this.pos; return this.finishToken(types$1.braceL)
    case 125: ++this.pos; return this.finishToken(types$1.braceR)
    case 58: ++this.pos; return this.finishToken(types$1.colon)

    case 96: // '`'
      if (this.options.ecmaVersion < 6) { break }
      ++this.pos;
      return this.finishToken(types$1.backQuote)

    case 48: // '0'
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 120 || next === 88) { return this.readRadixNumber(16) } // '0x', '0X' - hex number
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) { return this.readRadixNumber(8) } // '0o', '0O' - octal number
        if (next === 98 || next === 66) { return this.readRadixNumber(2) } // '0b', '0B' - binary number
      }

    // Anything else beginning with a digit is an integer, octal
    // number, or float.
    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
      return this.readNumber(false)

    // Quotes produce strings.
    case 34: case 39: // '"', "'"
      return this.readString(code)

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.
    case 47: // '/'
      return this.readToken_slash()

    case 37: case 42: // '%*'
      return this.readToken_mult_modulo_exp(code)

    case 124: case 38: // '|&'
      return this.readToken_pipe_amp(code)

    case 94: // '^'
      return this.readToken_caret()

    case 43: case 45: // '+-'
      return this.readToken_plus_min(code)

    case 60: case 62: // '<>'
      return this.readToken_lt_gt(code)

    case 61: case 33: // '=!'
      return this.readToken_eq_excl(code)

    case 63: // '?'
      return this.readToken_question()

    case 126: // '~'
      return this.finishOp(types$1.prefix, 1)

    case 35: // '#'
      return this.readToken_numberSign()
    }

    this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
  };

  pp.finishOp = function(type, size) {
    var str = this.input.slice(this.pos, this.pos + size);
    this.pos += size;
    return this.finishToken(type, str)
  };

  pp.readRegexp = function() {
    var escaped, inClass, start = this.pos;
    for (;;) {
      if (this.pos >= this.input.length) { this.raise(start, "Unterminated regular expression"); }
      var ch = this.input.charAt(this.pos);
      if (lineBreak.test(ch)) { this.raise(start, "Unterminated regular expression"); }
      if (!escaped) {
        if (ch === "[") { inClass = true; }
        else if (ch === "]" && inClass) { inClass = false; }
        else if (ch === "/" && !inClass) { break }
        escaped = ch === "\\";
      } else { escaped = false; }
      ++this.pos;
    }
    var pattern = this.input.slice(start, this.pos);
    ++this.pos;
    var flagsStart = this.pos;
    var flags = this.readWord1();
    if (this.containsEsc) { this.unexpected(flagsStart); }

    // Validate pattern
    var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
    state.reset(start, pattern, flags);
    this.validateRegExpFlags(state);
    this.validateRegExpPattern(state);

    // Create Literal#value property value.
    var value = null;
    try {
      value = new RegExp(pattern, flags);
    } catch (e) {
      // ESTree requires null if it failed to instantiate RegExp object.
      // https://github.com/estree/estree/blob/a27003adf4fd7bfad44de9cef372a2eacd527b1c/es5.md#regexpliteral
    }

    return this.finishToken(types$1.regexp, {pattern: pattern, flags: flags, value: value})
  };

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  pp.readInt = function(radix, len, maybeLegacyOctalNumericLiteral) {
    // `len` is used for character escape sequences. In that case, disallow separators.
    var allowSeparators = this.options.ecmaVersion >= 12 && len === undefined;

    // `maybeLegacyOctalNumericLiteral` is true if it doesn't have prefix (0x,0o,0b)
    // and isn't fraction part nor exponent part. In that case, if the first digit
    // is zero then disallow separators.
    var isLegacyOctalNumericLiteral = maybeLegacyOctalNumericLiteral && this.input.charCodeAt(this.pos) === 48;

    var start = this.pos, total = 0, lastCode = 0;
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i, ++this.pos) {
      var code = this.input.charCodeAt(this.pos), val = (void 0);

      if (allowSeparators && code === 95) {
        if (isLegacyOctalNumericLiteral) { this.raiseRecoverable(this.pos, "Numeric separator is not allowed in legacy octal numeric literals"); }
        if (lastCode === 95) { this.raiseRecoverable(this.pos, "Numeric separator must be exactly one underscore"); }
        if (i === 0) { this.raiseRecoverable(this.pos, "Numeric separator is not allowed at the first of digits"); }
        lastCode = code;
        continue
      }

      if (code >= 97) { val = code - 97 + 10; } // a
      else if (code >= 65) { val = code - 65 + 10; } // A
      else if (code >= 48 && code <= 57) { val = code - 48; } // 0-9
      else { val = Infinity; }
      if (val >= radix) { break }
      lastCode = code;
      total = total * radix + val;
    }

    if (allowSeparators && lastCode === 95) { this.raiseRecoverable(this.pos - 1, "Numeric separator is not allowed at the last of digits"); }
    if (this.pos === start || len != null && this.pos - start !== len) { return null }

    return total
  };

  function stringToNumber(str, isLegacyOctalNumericLiteral) {
    if (isLegacyOctalNumericLiteral) {
      return parseInt(str, 8)
    }

    // `parseFloat(value)` stops parsing at the first numeric separator then returns a wrong value.
    return parseFloat(str.replace(/_/g, ""))
  }

  function stringToBigInt(str) {
    if (typeof BigInt !== "function") {
      return null
    }

    // `BigInt(value)` throws syntax error if the string contains numeric separators.
    return BigInt(str.replace(/_/g, ""))
  }

  pp.readRadixNumber = function(radix) {
    var start = this.pos;
    this.pos += 2; // 0x
    var val = this.readInt(radix);
    if (val == null) { this.raise(this.start + 2, "Expected number in radix " + radix); }
    if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
      val = stringToBigInt(this.input.slice(start, this.pos));
      ++this.pos;
    } else if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
    return this.finishToken(types$1.num, val)
  };

  // Read an integer, octal integer, or floating-point number.

  pp.readNumber = function(startsWithDot) {
    var start = this.pos;
    if (!startsWithDot && this.readInt(10, undefined, true) === null) { this.raise(start, "Invalid number"); }
    var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
    if (octal && this.strict) { this.raise(start, "Invalid number"); }
    var next = this.input.charCodeAt(this.pos);
    if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
      var val$1 = stringToBigInt(this.input.slice(start, this.pos));
      ++this.pos;
      if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
      return this.finishToken(types$1.num, val$1)
    }
    if (octal && /[89]/.test(this.input.slice(start, this.pos))) { octal = false; }
    if (next === 46 && !octal) { // '.'
      ++this.pos;
      this.readInt(10);
      next = this.input.charCodeAt(this.pos);
    }
    if ((next === 69 || next === 101) && !octal) { // 'eE'
      next = this.input.charCodeAt(++this.pos);
      if (next === 43 || next === 45) { ++this.pos; } // '+-'
      if (this.readInt(10) === null) { this.raise(start, "Invalid number"); }
    }
    if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }

    var val = stringToNumber(this.input.slice(start, this.pos), octal);
    return this.finishToken(types$1.num, val)
  };

  // Read a string value, interpreting backslash-escapes.

  pp.readCodePoint = function() {
    var ch = this.input.charCodeAt(this.pos), code;

    if (ch === 123) { // '{'
      if (this.options.ecmaVersion < 6) { this.unexpected(); }
      var codePos = ++this.pos;
      code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
      ++this.pos;
      if (code > 0x10FFFF) { this.invalidStringToken(codePos, "Code point out of bounds"); }
    } else {
      code = this.readHexChar(4);
    }
    return code
  };

  pp.readString = function(quote) {
    var out = "", chunkStart = ++this.pos;
    for (;;) {
      if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated string constant"); }
      var ch = this.input.charCodeAt(this.pos);
      if (ch === quote) { break }
      if (ch === 92) { // '\'
        out += this.input.slice(chunkStart, this.pos);
        out += this.readEscapedChar(false);
        chunkStart = this.pos;
      } else if (ch === 0x2028 || ch === 0x2029) {
        if (this.options.ecmaVersion < 10) { this.raise(this.start, "Unterminated string constant"); }
        ++this.pos;
        if (this.options.locations) {
          this.curLine++;
          this.lineStart = this.pos;
        }
      } else {
        if (isNewLine(ch)) { this.raise(this.start, "Unterminated string constant"); }
        ++this.pos;
      }
    }
    out += this.input.slice(chunkStart, this.pos++);
    return this.finishToken(types$1.string, out)
  };

  // Reads template string tokens.

  var INVALID_TEMPLATE_ESCAPE_ERROR = {};

  pp.tryReadTemplateToken = function() {
    this.inTemplateElement = true;
    try {
      this.readTmplToken();
    } catch (err) {
      if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
        this.readInvalidTemplateToken();
      } else {
        throw err
      }
    }

    this.inTemplateElement = false;
  };

  pp.invalidStringToken = function(position, message) {
    if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
      throw INVALID_TEMPLATE_ESCAPE_ERROR
    } else {
      this.raise(position, message);
    }
  };

  pp.readTmplToken = function() {
    var out = "", chunkStart = this.pos;
    for (;;) {
      if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated template"); }
      var ch = this.input.charCodeAt(this.pos);
      if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) { // '`', '${'
        if (this.pos === this.start && (this.type === types$1.template || this.type === types$1.invalidTemplate)) {
          if (ch === 36) {
            this.pos += 2;
            return this.finishToken(types$1.dollarBraceL)
          } else {
            ++this.pos;
            return this.finishToken(types$1.backQuote)
          }
        }
        out += this.input.slice(chunkStart, this.pos);
        return this.finishToken(types$1.template, out)
      }
      if (ch === 92) { // '\'
        out += this.input.slice(chunkStart, this.pos);
        out += this.readEscapedChar(true);
        chunkStart = this.pos;
      } else if (isNewLine(ch)) {
        out += this.input.slice(chunkStart, this.pos);
        ++this.pos;
        switch (ch) {
        case 13:
          if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; }
        case 10:
          out += "\n";
          break
        default:
          out += String.fromCharCode(ch);
          break
        }
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        chunkStart = this.pos;
      } else {
        ++this.pos;
      }
    }
  };

  // Reads a template token to search for the end, without validating any escape sequences
  pp.readInvalidTemplateToken = function() {
    for (; this.pos < this.input.length; this.pos++) {
      switch (this.input[this.pos]) {
      case "\\":
        ++this.pos;
        break

      case "$":
        if (this.input[this.pos + 1] !== "{") { break }
        // fall through
      case "`":
        return this.finishToken(types$1.invalidTemplate, this.input.slice(this.start, this.pos))

      case "\r":
        if (this.input[this.pos + 1] === "\n") { ++this.pos; }
        // fall through
      case "\n": case "\u2028": case "\u2029":
        ++this.curLine;
        this.lineStart = this.pos + 1;
        break
      }
    }
    this.raise(this.start, "Unterminated template");
  };

  // Used to read escaped characters

  pp.readEscapedChar = function(inTemplate) {
    var ch = this.input.charCodeAt(++this.pos);
    ++this.pos;
    switch (ch) {
    case 110: return "\n" // 'n' -> '\n'
    case 114: return "\r" // 'r' -> '\r'
    case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
    case 117: return codePointToString(this.readCodePoint()) // 'u'
    case 116: return "\t" // 't' -> '\t'
    case 98: return "\b" // 'b' -> '\b'
    case 118: return "\u000b" // 'v' -> '\u000b'
    case 102: return "\f" // 'f' -> '\f'
    case 13: if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; } // '\r\n'
    case 10: // ' \n'
      if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
      return ""
    case 56:
    case 57:
      if (this.strict) {
        this.invalidStringToken(
          this.pos - 1,
          "Invalid escape sequence"
        );
      }
      if (inTemplate) {
        var codePos = this.pos - 1;

        this.invalidStringToken(
          codePos,
          "Invalid escape sequence in template string"
        );
      }
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
        var octal = parseInt(octalStr, 8);
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1);
          octal = parseInt(octalStr, 8);
        }
        this.pos += octalStr.length - 1;
        ch = this.input.charCodeAt(this.pos);
        if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
          this.invalidStringToken(
            this.pos - 1 - octalStr.length,
            inTemplate
              ? "Octal literal in template string"
              : "Octal literal in strict mode"
          );
        }
        return String.fromCharCode(octal)
      }
      if (isNewLine(ch)) {
        // Unicode new line characters after \ get removed from output in both
        // template literals and strings
        if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
        return ""
      }
      return String.fromCharCode(ch)
    }
  };

  // Used to read character escape sequences ('\x', '\u', '\U').

  pp.readHexChar = function(len) {
    var codePos = this.pos;
    var n = this.readInt(16, len);
    if (n === null) { this.invalidStringToken(codePos, "Bad character escape sequence"); }
    return n
  };

  // Read an identifier, and return it as a string. Sets `this.containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Incrementally adds only escaped chars, adding other chunks as-is
  // as a micro-optimization.

  pp.readWord1 = function() {
    this.containsEsc = false;
    var word = "", first = true, chunkStart = this.pos;
    var astral = this.options.ecmaVersion >= 6;
    while (this.pos < this.input.length) {
      var ch = this.fullCharCodeAtPos();
      if (isIdentifierChar(ch, astral)) {
        this.pos += ch <= 0xffff ? 1 : 2;
      } else if (ch === 92) { // "\"
        this.containsEsc = true;
        word += this.input.slice(chunkStart, this.pos);
        var escStart = this.pos;
        if (this.input.charCodeAt(++this.pos) !== 117) // "u"
          { this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX"); }
        ++this.pos;
        var esc = this.readCodePoint();
        if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
          { this.invalidStringToken(escStart, "Invalid Unicode escape"); }
        word += codePointToString(esc);
        chunkStart = this.pos;
      } else {
        break
      }
      first = false;
    }
    return word + this.input.slice(chunkStart, this.pos)
  };

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  pp.readWord = function() {
    var word = this.readWord1();
    var type = types$1.name;
    if (this.keywords.test(word)) {
      type = keywords[word];
    }
    return this.finishToken(type, word)
  };

  // Acorn is a tiny, fast JavaScript parser written in JavaScript.
  //
  // Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
  // various contributors and released under an MIT license.
  //
  // Git repositories for Acorn are available at
  //
  //     http://marijnhaverbeke.nl/git/acorn
  //     https://github.com/acornjs/acorn.git
  //
  // Please use the [github bug tracker][ghbt] to report issues.
  //
  // [ghbt]: https://github.com/acornjs/acorn/issues


  var version = "8.15.0";

  Parser$1.acorn = {
    Parser: Parser$1,
    version: version,
    defaultOptions: defaultOptions,
    Position: Position,
    SourceLocation: SourceLocation,
    getLineInfo: getLineInfo,
    Node: Node,
    TokenType: TokenType$1,
    tokTypes: types$1,
    keywordTypes: keywords,
    TokContext: TokContext,
    tokContexts: types$2,
    isIdentifierChar: isIdentifierChar,
    isIdentifierStart: isIdentifierStart,
    Token: Token$1,
    isNewLine: isNewLine,
    lineBreak: lineBreak,
    lineBreakG: lineBreakG,
    nonASCIIwhitespace: nonASCIIwhitespace
  };

  // The main exported interface (under `self.acorn` when in the
  // browser) is a `parse` function that takes a code string and returns
  // an abstract syntax tree as specified by the [ESTree spec][estree].
  //
  // [estree]: https://github.com/estree/estree

  function parse(input, options) {
    return Parser$1.parse(input, options)
  }

  // Astring is a tiny and fast JavaScript code generator from an ESTree-compliant AST.
  //
  // Astring was written by David Bonnet and released under an MIT license.
  //
  // The Git repository for Astring is available at:
  // https://github.com/davidbonnet/astring.git
  //
  // Please use the GitHub bug tracker to report issues:
  // https://github.com/davidbonnet/astring/issues

  const { stringify } = JSON;

  /* c8 ignore if */
  if (!String.prototype.repeat) {
    /* c8 ignore next */
    throw new Error(
      'String.prototype.repeat is undefined, see https://github.com/davidbonnet/astring#installation',
    )
  }

  /* c8 ignore if */
  if (!String.prototype.endsWith) {
    /* c8 ignore next */
    throw new Error(
      'String.prototype.endsWith is undefined, see https://github.com/davidbonnet/astring#installation',
    )
  }

  const OPERATOR_PRECEDENCE = {
    '||': 2,
    '??': 3,
    '&&': 4,
    '|': 5,
    '^': 6,
    '&': 7,
    '==': 8,
    '!=': 8,
    '===': 8,
    '!==': 8,
    '<': 9,
    '>': 9,
    '<=': 9,
    '>=': 9,
    in: 9,
    instanceof: 9,
    '<<': 10,
    '>>': 10,
    '>>>': 10,
    '+': 11,
    '-': 11,
    '*': 12,
    '%': 12,
    '/': 12,
    '**': 13,
  };

  // Enables parenthesis regardless of precedence
  const NEEDS_PARENTHESES = 17;

  const EXPRESSIONS_PRECEDENCE = {
    // Definitions
    ArrayExpression: 20,
    TaggedTemplateExpression: 20,
    ThisExpression: 20,
    Identifier: 20,
    PrivateIdentifier: 20,
    Literal: 18,
    TemplateLiteral: 20,
    Super: 20,
    SequenceExpression: 20,
    // Operations
    MemberExpression: 19,
    ChainExpression: 19,
    CallExpression: 19,
    NewExpression: 19,
    // Other definitions
    ArrowFunctionExpression: NEEDS_PARENTHESES,
    ClassExpression: NEEDS_PARENTHESES,
    FunctionExpression: NEEDS_PARENTHESES,
    ObjectExpression: NEEDS_PARENTHESES,
    // Other operations
    UpdateExpression: 16,
    UnaryExpression: 15,
    AwaitExpression: 15,
    BinaryExpression: 14,
    LogicalExpression: 13,
    ConditionalExpression: 4,
    AssignmentExpression: 3,
    YieldExpression: 2,
    RestElement: 1,
  };

  function formatSequence(state, nodes) {
    /*
    Writes into `state` a sequence of `nodes`.
    */
    const { generator } = state;
    state.write('(');
    if (nodes != null && nodes.length > 0) {
      generator[nodes[0].type](nodes[0], state);
      const { length } = nodes;
      for (let i = 1; i < length; i++) {
        const param = nodes[i];
        state.write(', ');
        generator[param.type](param, state);
      }
    }
    state.write(')');
  }

  function expressionNeedsParenthesis(state, node, parentNode, isRightHand) {
    const nodePrecedence = state.expressionsPrecedence[node.type];
    if (nodePrecedence === NEEDS_PARENTHESES) {
      return true
    }
    const parentNodePrecedence = state.expressionsPrecedence[parentNode.type];
    if (nodePrecedence !== parentNodePrecedence) {
      // Different node types
      return (
        (!isRightHand &&
          nodePrecedence === 15 &&
          parentNodePrecedence === 14 &&
          parentNode.operator === '**') ||
        nodePrecedence < parentNodePrecedence
      )
    }
    if (nodePrecedence !== 13 && nodePrecedence !== 14) {
      // Not a `LogicalExpression` or `BinaryExpression`
      return false
    }
    if (node.operator === '**' && parentNode.operator === '**') {
      // Exponentiation operator has right-to-left associativity
      return !isRightHand
    }
    if (
      nodePrecedence === 13 &&
      parentNodePrecedence === 13 &&
      (node.operator === '??' || parentNode.operator === '??')
    ) {
      // Nullish coalescing and boolean operators cannot be combined
      return true
    }
    if (isRightHand) {
      // Parenthesis are used if both operators have the same precedence
      return (
        OPERATOR_PRECEDENCE[node.operator] <=
        OPERATOR_PRECEDENCE[parentNode.operator]
      )
    }
    return (
      OPERATOR_PRECEDENCE[node.operator] <
      OPERATOR_PRECEDENCE[parentNode.operator]
    )
  }

  function formatExpression(state, node, parentNode, isRightHand) {
    /*
    Writes into `state` the provided `node`, adding parenthesis around if the provided `parentNode` needs it. If `node` is a right-hand argument, the provided `isRightHand` parameter should be `true`.
    */
    const { generator } = state;
    if (expressionNeedsParenthesis(state, node, parentNode, isRightHand)) {
      state.write('(');
      generator[node.type](node, state);
      state.write(')');
    } else {
      generator[node.type](node, state);
    }
  }

  function reindent(state, text, indent, lineEnd) {
    /*
    Writes into `state` the `text` string reindented with the provided `indent`.
    */
    const lines = text.split('\n');
    const end = lines.length - 1;
    state.write(lines[0].trim());
    if (end > 0) {
      state.write(lineEnd);
      for (let i = 1; i < end; i++) {
        state.write(indent + lines[i].trim() + lineEnd);
      }
      state.write(indent + lines[end].trim());
    }
  }

  function formatComments(state, comments, indent, lineEnd) {
    /*
    Writes into `state` the provided list of `comments`, with the given `indent` and `lineEnd` strings.
    Line comments will end with `"\n"` regardless of the value of `lineEnd`.
    Expects to start on a new unindented line.
    */
    const { length } = comments;
    for (let i = 0; i < length; i++) {
      const comment = comments[i];
      state.write(indent);
      if (comment.type[0] === 'L') {
        // Line comment
        state.write('// ' + comment.value.trim() + '\n', comment);
      } else {
        // Block comment
        state.write('/*');
        reindent(state, comment.value, indent, lineEnd);
        state.write('*/' + lineEnd);
      }
    }
  }

  function hasCallExpression(node) {
    /*
    Returns `true` if the provided `node` contains a call expression and `false` otherwise.
    */
    let currentNode = node;
    while (currentNode != null) {
      const { type } = currentNode;
      if (type[0] === 'C' && type[1] === 'a') {
        // Is CallExpression
        return true
      } else if (type[0] === 'M' && type[1] === 'e' && type[2] === 'm') {
        // Is MemberExpression
        currentNode = currentNode.object;
      } else {
        return false
      }
    }
  }

  function formatVariableDeclaration(state, node) {
    /*
    Writes into `state` a variable declaration.
    */
    const { generator } = state;
    const { declarations } = node;
    state.write(node.kind + ' ');
    const { length } = declarations;
    if (length > 0) {
      generator.VariableDeclarator(declarations[0], state);
      for (let i = 1; i < length; i++) {
        state.write(', ');
        generator.VariableDeclarator(declarations[i], state);
      }
    }
  }

  let ForInStatement,
    FunctionDeclaration$1,
    RestElement,
    BinaryExpression$1,
    ArrayExpression$1,
    BlockStatement$1;

  const GENERATOR = {
    /*
    Default generator.
    */
    Program(node, state) {
      const indent = state.indent.repeat(state.indentLevel);
      const { lineEnd, writeComments } = state;
      if (writeComments && node.comments != null) {
        formatComments(state, node.comments, indent, lineEnd);
      }
      const statements = node.body;
      const { length } = statements;
      for (let i = 0; i < length; i++) {
        const statement = statements[i];
        if (writeComments && statement.comments != null) {
          formatComments(state, statement.comments, indent, lineEnd);
        }
        state.write(indent);
        this[statement.type](statement, state);
        state.write(lineEnd);
      }
      if (writeComments && node.trailingComments != null) {
        formatComments(state, node.trailingComments, indent, lineEnd);
      }
    },
    BlockStatement: (BlockStatement$1 = function (node, state) {
      const indent = state.indent.repeat(state.indentLevel++);
      const { lineEnd, writeComments } = state;
      const statementIndent = indent + state.indent;
      state.write('{');
      const statements = node.body;
      if (statements != null && statements.length > 0) {
        state.write(lineEnd);
        if (writeComments && node.comments != null) {
          formatComments(state, node.comments, statementIndent, lineEnd);
        }
        const { length } = statements;
        for (let i = 0; i < length; i++) {
          const statement = statements[i];
          if (writeComments && statement.comments != null) {
            formatComments(state, statement.comments, statementIndent, lineEnd);
          }
          state.write(statementIndent);
          this[statement.type](statement, state);
          state.write(lineEnd);
        }
        state.write(indent);
      } else {
        if (writeComments && node.comments != null) {
          state.write(lineEnd);
          formatComments(state, node.comments, statementIndent, lineEnd);
          state.write(indent);
        }
      }
      if (writeComments && node.trailingComments != null) {
        formatComments(state, node.trailingComments, statementIndent, lineEnd);
      }
      state.write('}');
      state.indentLevel--;
    }),
    ClassBody: BlockStatement$1,
    StaticBlock(node, state) {
      state.write('static ');
      this.BlockStatement(node, state);
    },
    EmptyStatement(node, state) {
      state.write(';');
    },
    ExpressionStatement(node, state) {
      const precedence = state.expressionsPrecedence[node.expression.type];
      if (
        precedence === NEEDS_PARENTHESES ||
        (precedence === 3 && node.expression.left.type[0] === 'O')
      ) {
        // Should always have parentheses or is an AssignmentExpression to an ObjectPattern
        state.write('(');
        this[node.expression.type](node.expression, state);
        state.write(')');
      } else {
        this[node.expression.type](node.expression, state);
      }
      state.write(';');
    },
    IfStatement(node, state) {
      state.write('if (');
      this[node.test.type](node.test, state);
      state.write(') ');
      this[node.consequent.type](node.consequent, state);
      if (node.alternate != null) {
        state.write(' else ');
        this[node.alternate.type](node.alternate, state);
      }
    },
    LabeledStatement(node, state) {
      this[node.label.type](node.label, state);
      state.write(': ');
      this[node.body.type](node.body, state);
    },
    BreakStatement(node, state) {
      state.write('break');
      if (node.label != null) {
        state.write(' ');
        this[node.label.type](node.label, state);
      }
      state.write(';');
    },
    ContinueStatement(node, state) {
      state.write('continue');
      if (node.label != null) {
        state.write(' ');
        this[node.label.type](node.label, state);
      }
      state.write(';');
    },
    WithStatement(node, state) {
      state.write('with (');
      this[node.object.type](node.object, state);
      state.write(') ');
      this[node.body.type](node.body, state);
    },
    SwitchStatement(node, state) {
      const indent = state.indent.repeat(state.indentLevel++);
      const { lineEnd, writeComments } = state;
      state.indentLevel++;
      const caseIndent = indent + state.indent;
      const statementIndent = caseIndent + state.indent;
      state.write('switch (');
      this[node.discriminant.type](node.discriminant, state);
      state.write(') {' + lineEnd);
      const { cases: occurences } = node;
      const { length: occurencesCount } = occurences;
      for (let i = 0; i < occurencesCount; i++) {
        const occurence = occurences[i];
        if (writeComments && occurence.comments != null) {
          formatComments(state, occurence.comments, caseIndent, lineEnd);
        }
        if (occurence.test) {
          state.write(caseIndent + 'case ');
          this[occurence.test.type](occurence.test, state);
          state.write(':' + lineEnd);
        } else {
          state.write(caseIndent + 'default:' + lineEnd);
        }
        const { consequent } = occurence;
        const { length: consequentCount } = consequent;
        for (let i = 0; i < consequentCount; i++) {
          const statement = consequent[i];
          if (writeComments && statement.comments != null) {
            formatComments(state, statement.comments, statementIndent, lineEnd);
          }
          state.write(statementIndent);
          this[statement.type](statement, state);
          state.write(lineEnd);
        }
      }
      state.indentLevel -= 2;
      state.write(indent + '}');
    },
    ReturnStatement(node, state) {
      state.write('return');
      if (node.argument) {
        state.write(' ');
        this[node.argument.type](node.argument, state);
      }
      state.write(';');
    },
    ThrowStatement(node, state) {
      state.write('throw ');
      this[node.argument.type](node.argument, state);
      state.write(';');
    },
    TryStatement(node, state) {
      state.write('try ');
      this[node.block.type](node.block, state);
      if (node.handler) {
        const { handler } = node;
        if (handler.param == null) {
          state.write(' catch ');
        } else {
          state.write(' catch (');
          this[handler.param.type](handler.param, state);
          state.write(') ');
        }
        this[handler.body.type](handler.body, state);
      }
      if (node.finalizer) {
        state.write(' finally ');
        this[node.finalizer.type](node.finalizer, state);
      }
    },
    WhileStatement(node, state) {
      state.write('while (');
      this[node.test.type](node.test, state);
      state.write(') ');
      this[node.body.type](node.body, state);
    },
    DoWhileStatement(node, state) {
      state.write('do ');
      this[node.body.type](node.body, state);
      state.write(' while (');
      this[node.test.type](node.test, state);
      state.write(');');
    },
    ForStatement(node, state) {
      state.write('for (');
      if (node.init != null) {
        const { init } = node;
        if (init.type[0] === 'V') {
          formatVariableDeclaration(state, init);
        } else {
          this[init.type](init, state);
        }
      }
      state.write('; ');
      if (node.test) {
        this[node.test.type](node.test, state);
      }
      state.write('; ');
      if (node.update) {
        this[node.update.type](node.update, state);
      }
      state.write(') ');
      this[node.body.type](node.body, state);
    },
    ForInStatement: (ForInStatement = function (node, state) {
      state.write(`for ${node.await ? 'await ' : ''}(`);
      const { left } = node;
      if (left.type[0] === 'V') {
        formatVariableDeclaration(state, left);
      } else {
        this[left.type](left, state);
      }
      // Identifying whether node.type is `ForInStatement` or `ForOfStatement`
      state.write(node.type[3] === 'I' ? ' in ' : ' of ');
      this[node.right.type](node.right, state);
      state.write(') ');
      this[node.body.type](node.body, state);
    }),
    ForOfStatement: ForInStatement,
    DebuggerStatement(node, state) {
      state.write('debugger;', node);
    },
    FunctionDeclaration: (FunctionDeclaration$1 = function (node, state) {
      state.write(
        (node.async ? 'async ' : '') +
          (node.generator ? 'function* ' : 'function ') +
          (node.id ? node.id.name : ''),
        node,
      );
      formatSequence(state, node.params);
      state.write(' ');
      this[node.body.type](node.body, state);
    }),
    FunctionExpression: FunctionDeclaration$1,
    VariableDeclaration(node, state) {
      formatVariableDeclaration(state, node);
      state.write(';');
    },
    VariableDeclarator(node, state) {
      this[node.id.type](node.id, state);
      if (node.init != null) {
        state.write(' = ');
        this[node.init.type](node.init, state);
      }
    },
    ClassDeclaration(node, state) {
      state.write('class ' + (node.id ? `${node.id.name} ` : ''), node);
      if (node.superClass) {
        state.write('extends ');
        const { superClass } = node;
        const { type } = superClass;
        const precedence = state.expressionsPrecedence[type];
        if (
          (type[0] !== 'C' || type[1] !== 'l' || type[5] !== 'E') &&
          (precedence === NEEDS_PARENTHESES ||
            precedence < state.expressionsPrecedence.ClassExpression)
        ) {
          // Not a ClassExpression that needs parentheses
          state.write('(');
          this[node.superClass.type](superClass, state);
          state.write(')');
        } else {
          this[superClass.type](superClass, state);
        }
        state.write(' ');
      }
      this.ClassBody(node.body, state);
    },
    ImportDeclaration(node, state) {
      state.write('import ');
      const { specifiers, attributes } = node;
      const { length } = specifiers;
      // TODO: Once babili is fixed, put this after condition
      // https://github.com/babel/babili/issues/430
      let i = 0;
      if (length > 0) {
        for (; i < length; ) {
          if (i > 0) {
            state.write(', ');
          }
          const specifier = specifiers[i];
          const type = specifier.type[6];
          if (type === 'D') {
            // ImportDefaultSpecifier
            state.write(specifier.local.name, specifier);
            i++;
          } else if (type === 'N') {
            // ImportNamespaceSpecifier
            state.write('* as ' + specifier.local.name, specifier);
            i++;
          } else {
            // ImportSpecifier
            break
          }
        }
        if (i < length) {
          state.write('{');
          for (;;) {
            const specifier = specifiers[i];
            const { name } = specifier.imported;
            state.write(name, specifier);
            if (name !== specifier.local.name) {
              state.write(' as ' + specifier.local.name);
            }
            if (++i < length) {
              state.write(', ');
            } else {
              break
            }
          }
          state.write('}');
        }
        state.write(' from ');
      }
      this.Literal(node.source, state);

      if (attributes && attributes.length > 0) {
        state.write(' with { ');
        for (let i = 0; i < attributes.length; i++) {
          this.ImportAttribute(attributes[i], state);
          if (i < attributes.length - 1) state.write(', ');
        }

        state.write(' }');
      }
      state.write(';');
    },
    ImportAttribute(node, state) {
      this.Identifier(node.key, state);
      state.write(': ');
      this.Literal(node.value, state);
    },
    ImportExpression(node, state) {
      state.write('import(');
      this[node.source.type](node.source, state);
      state.write(')');
    },
    ExportDefaultDeclaration(node, state) {
      state.write('export default ');
      this[node.declaration.type](node.declaration, state);
      if (
        state.expressionsPrecedence[node.declaration.type] != null &&
        node.declaration.type[0] !== 'F'
      ) {
        // All expression nodes except `FunctionExpression`
        state.write(';');
      }
    },
    ExportNamedDeclaration(node, state) {
      state.write('export ');
      if (node.declaration) {
        this[node.declaration.type](node.declaration, state);
      } else {
        state.write('{');
        const { specifiers } = node,
          { length } = specifiers;
        if (length > 0) {
          for (let i = 0; ; ) {
            const specifier = specifiers[i];
            const { name } = specifier.local;
            state.write(name, specifier);
            if (name !== specifier.exported.name) {
              state.write(' as ' + specifier.exported.name);
            }
            if (++i < length) {
              state.write(', ');
            } else {
              break
            }
          }
        }
        state.write('}');
        if (node.source) {
          state.write(' from ');
          this.Literal(node.source, state);
        }

        if (node.attributes && node.attributes.length > 0) {
          state.write(' with { ');
          for (let i = 0; i < node.attributes.length; i++) {
            this.ImportAttribute(node.attributes[i], state);
            if (i < node.attributes.length - 1) state.write(', ');
          }

          state.write(' }');
        }

        state.write(';');
      }
    },
    ExportAllDeclaration(node, state) {
      if (node.exported != null) {
        state.write('export * as ' + node.exported.name + ' from ');
      } else {
        state.write('export * from ');
      }
      this.Literal(node.source, state);

      if (node.attributes && node.attributes.length > 0) {
        state.write(' with { ');
        for (let i = 0; i < node.attributes.length; i++) {
          this.ImportAttribute(node.attributes[i], state);
          if (i < node.attributes.length - 1) state.write(', ');
        }

        state.write(' }');
      }

      state.write(';');
    },
    MethodDefinition(node, state) {
      if (node.static) {
        state.write('static ');
      }
      const kind = node.kind[0];
      if (kind === 'g' || kind === 's') {
        // Getter or setter
        state.write(node.kind + ' ');
      }
      if (node.value.async) {
        state.write('async ');
      }
      if (node.value.generator) {
        state.write('*');
      }
      if (node.computed) {
        state.write('[');
        this[node.key.type](node.key, state);
        state.write(']');
      } else {
        this[node.key.type](node.key, state);
      }
      formatSequence(state, node.value.params);
      state.write(' ');
      this[node.value.body.type](node.value.body, state);
    },
    ClassExpression(node, state) {
      this.ClassDeclaration(node, state);
    },
    ArrowFunctionExpression(node, state) {
      state.write(node.async ? 'async ' : '', node);
      const { params } = node;
      if (params != null) {
        // Omit parenthesis if only one named parameter
        if (params.length === 1 && params[0].type[0] === 'I') {
          // If params[0].type[0] starts with 'I', it can't be `ImportDeclaration` nor `IfStatement` and thus is `Identifier`
          state.write(params[0].name, params[0]);
        } else {
          formatSequence(state, node.params);
        }
      }
      state.write(' => ');
      if (node.body.type[0] === 'O') {
        // Body is an object expression
        state.write('(');
        this.ObjectExpression(node.body, state);
        state.write(')');
      } else {
        this[node.body.type](node.body, state);
      }
    },
    ThisExpression(node, state) {
      state.write('this', node);
    },
    Super(node, state) {
      state.write('super', node);
    },
    RestElement: (RestElement = function (node, state) {
      state.write('...');
      this[node.argument.type](node.argument, state);
    }),
    SpreadElement: RestElement,
    YieldExpression(node, state) {
      state.write(node.delegate ? 'yield*' : 'yield');
      if (node.argument) {
        state.write(' ');
        this[node.argument.type](node.argument, state);
      }
    },
    AwaitExpression(node, state) {
      state.write('await ', node);
      formatExpression(state, node.argument, node);
    },
    TemplateLiteral(node, state) {
      const { quasis, expressions } = node;
      state.write('`');
      const { length } = expressions;
      for (let i = 0; i < length; i++) {
        const expression = expressions[i];
        const quasi = quasis[i];
        state.write(quasi.value.raw, quasi);
        state.write('${');
        this[expression.type](expression, state);
        state.write('}');
      }
      const quasi = quasis[quasis.length - 1];
      state.write(quasi.value.raw, quasi);
      state.write('`');
    },
    TemplateElement(node, state) {
      state.write(node.value.raw, node);
    },
    TaggedTemplateExpression(node, state) {
      formatExpression(state, node.tag, node);
      this[node.quasi.type](node.quasi, state);
    },
    ArrayExpression: (ArrayExpression$1 = function (node, state) {
      state.write('[');
      if (node.elements.length > 0) {
        const { elements } = node,
          { length } = elements;
        for (let i = 0; ; ) {
          const element = elements[i];
          if (element != null) {
            this[element.type](element, state);
          }
          if (++i < length) {
            state.write(', ');
          } else {
            if (element == null) {
              state.write(', ');
            }
            break
          }
        }
      }
      state.write(']');
    }),
    ArrayPattern: ArrayExpression$1,
    ObjectExpression(node, state) {
      const indent = state.indent.repeat(state.indentLevel++);
      const { lineEnd, writeComments } = state;
      const propertyIndent = indent + state.indent;
      state.write('{');
      if (node.properties.length > 0) {
        state.write(lineEnd);
        if (writeComments && node.comments != null) {
          formatComments(state, node.comments, propertyIndent, lineEnd);
        }
        const comma = ',' + lineEnd;
        const { properties } = node,
          { length } = properties;
        for (let i = 0; ; ) {
          const property = properties[i];
          if (writeComments && property.comments != null) {
            formatComments(state, property.comments, propertyIndent, lineEnd);
          }
          state.write(propertyIndent);
          this[property.type](property, state);
          if (++i < length) {
            state.write(comma);
          } else {
            break
          }
        }
        state.write(lineEnd);
        if (writeComments && node.trailingComments != null) {
          formatComments(state, node.trailingComments, propertyIndent, lineEnd);
        }
        state.write(indent + '}');
      } else if (writeComments) {
        if (node.comments != null) {
          state.write(lineEnd);
          formatComments(state, node.comments, propertyIndent, lineEnd);
          if (node.trailingComments != null) {
            formatComments(state, node.trailingComments, propertyIndent, lineEnd);
          }
          state.write(indent + '}');
        } else if (node.trailingComments != null) {
          state.write(lineEnd);
          formatComments(state, node.trailingComments, propertyIndent, lineEnd);
          state.write(indent + '}');
        } else {
          state.write('}');
        }
      } else {
        state.write('}');
      }
      state.indentLevel--;
    },
    Property(node, state) {
      if (node.method || node.kind[0] !== 'i') {
        // Either a method or of kind `set` or `get` (not `init`)
        this.MethodDefinition(node, state);
      } else {
        if (!node.shorthand) {
          if (node.computed) {
            state.write('[');
            this[node.key.type](node.key, state);
            state.write(']');
          } else {
            this[node.key.type](node.key, state);
          }
          state.write(': ');
        }
        this[node.value.type](node.value, state);
      }
    },
    PropertyDefinition(node, state) {
      if (node.static) {
        state.write('static ');
      }
      if (node.computed) {
        state.write('[');
      }
      this[node.key.type](node.key, state);
      if (node.computed) {
        state.write(']');
      }
      if (node.value == null) {
        if (node.key.type[0] !== 'F') {
          state.write(';');
        }
        return
      }
      state.write(' = ');
      this[node.value.type](node.value, state);
      state.write(';');
    },
    ObjectPattern(node, state) {
      state.write('{');
      if (node.properties.length > 0) {
        const { properties } = node,
          { length } = properties;
        for (let i = 0; ; ) {
          this[properties[i].type](properties[i], state);
          if (++i < length) {
            state.write(', ');
          } else {
            break
          }
        }
      }
      state.write('}');
    },
    SequenceExpression(node, state) {
      formatSequence(state, node.expressions);
    },
    UnaryExpression(node, state) {
      if (node.prefix) {
        const {
          operator,
          argument,
          argument: { type },
        } = node;
        state.write(operator);
        const needsParentheses = expressionNeedsParenthesis(state, argument, node);
        if (
          !needsParentheses &&
          (operator.length > 1 ||
            (type[0] === 'U' &&
              (type[1] === 'n' || type[1] === 'p') &&
              argument.prefix &&
              argument.operator[0] === operator &&
              (operator === '+' || operator === '-')))
        ) {
          // Large operator or argument is UnaryExpression or UpdateExpression node
          state.write(' ');
        }
        if (needsParentheses) {
          state.write(operator.length > 1 ? ' (' : '(');
          this[type](argument, state);
          state.write(')');
        } else {
          this[type](argument, state);
        }
      } else {
        // FIXME: This case never occurs
        this[node.argument.type](node.argument, state);
        state.write(node.operator);
      }
    },
    UpdateExpression(node, state) {
      // Always applied to identifiers or members, no parenthesis check needed
      if (node.prefix) {
        state.write(node.operator);
        this[node.argument.type](node.argument, state);
      } else {
        this[node.argument.type](node.argument, state);
        state.write(node.operator);
      }
    },
    AssignmentExpression(node, state) {
      this[node.left.type](node.left, state);
      state.write(' ' + node.operator + ' ');
      this[node.right.type](node.right, state);
    },
    AssignmentPattern(node, state) {
      this[node.left.type](node.left, state);
      state.write(' = ');
      this[node.right.type](node.right, state);
    },
    BinaryExpression: (BinaryExpression$1 = function (node, state) {
      const isIn = node.operator === 'in';
      if (isIn) {
        // Avoids confusion in `for` loops initializers
        state.write('(');
      }
      formatExpression(state, node.left, node, false);
      state.write(' ' + node.operator + ' ');
      formatExpression(state, node.right, node, true);
      if (isIn) {
        state.write(')');
      }
    }),
    LogicalExpression: BinaryExpression$1,
    ConditionalExpression(node, state) {
      const { test } = node;
      const precedence = state.expressionsPrecedence[test.type];
      if (
        precedence === NEEDS_PARENTHESES ||
        precedence <= state.expressionsPrecedence.ConditionalExpression
      ) {
        state.write('(');
        this[test.type](test, state);
        state.write(')');
      } else {
        this[test.type](test, state);
      }
      state.write(' ? ');
      this[node.consequent.type](node.consequent, state);
      state.write(' : ');
      this[node.alternate.type](node.alternate, state);
    },
    NewExpression(node, state) {
      state.write('new ');
      const precedence = state.expressionsPrecedence[node.callee.type];
      if (
        precedence === NEEDS_PARENTHESES ||
        precedence < state.expressionsPrecedence.CallExpression ||
        hasCallExpression(node.callee)
      ) {
        state.write('(');
        this[node.callee.type](node.callee, state);
        state.write(')');
      } else {
        this[node.callee.type](node.callee, state);
      }
      formatSequence(state, node['arguments']);
    },
    CallExpression(node, state) {
      const precedence = state.expressionsPrecedence[node.callee.type];
      if (
        precedence === NEEDS_PARENTHESES ||
        precedence < state.expressionsPrecedence.CallExpression
      ) {
        state.write('(');
        this[node.callee.type](node.callee, state);
        state.write(')');
      } else {
        this[node.callee.type](node.callee, state);
      }
      if (node.optional) {
        state.write('?.');
      }
      formatSequence(state, node['arguments']);
    },
    ChainExpression(node, state) {
      this[node.expression.type](node.expression, state);
    },
    MemberExpression(node, state) {
      const precedence = state.expressionsPrecedence[node.object.type];
      if (
        precedence === NEEDS_PARENTHESES ||
        precedence < state.expressionsPrecedence.MemberExpression
      ) {
        state.write('(');
        this[node.object.type](node.object, state);
        state.write(')');
      } else {
        this[node.object.type](node.object, state);
      }
      if (node.computed) {
        if (node.optional) {
          state.write('?.');
        }
        state.write('[');
        this[node.property.type](node.property, state);
        state.write(']');
      } else {
        if (node.optional) {
          state.write('?.');
        } else {
          state.write('.');
        }
        this[node.property.type](node.property, state);
      }
    },
    MetaProperty(node, state) {
      state.write(node.meta.name + '.' + node.property.name, node);
    },
    Identifier(node, state) {
      state.write(node.name, node);
    },
    PrivateIdentifier(node, state) {
      state.write(`#${node.name}`, node);
    },
    Literal(node, state) {
      if (node.raw != null) {
        // Non-standard property
        state.write(node.raw, node);
      } else if (node.regex != null) {
        this.RegExpLiteral(node, state);
      } else if (node.bigint != null) {
        state.write(node.bigint + 'n', node);
      } else {
        state.write(stringify(node.value), node);
      }
    },
    RegExpLiteral(node, state) {
      const { regex } = node;
      state.write(`/${regex.pattern}/${regex.flags}`, node);
    },
  };

  const EMPTY_OBJECT = {};

  /*
  DEPRECATED: Alternate export of `GENERATOR`.
  */
  const baseGenerator = GENERATOR;

  class State {
    constructor(options) {
      const setup = options == null ? EMPTY_OBJECT : options;
      this.output = '';
      // Functional options
      if (setup.output != null) {
        this.output = setup.output;
        this.write = this.writeToStream;
      } else {
        this.output = '';
      }
      this.generator = setup.generator != null ? setup.generator : GENERATOR;
      this.expressionsPrecedence =
        setup.expressionsPrecedence != null
          ? setup.expressionsPrecedence
          : EXPRESSIONS_PRECEDENCE;
      // Formating setup
      this.indent = setup.indent != null ? setup.indent : '  ';
      this.lineEnd = setup.lineEnd != null ? setup.lineEnd : '\n';
      this.indentLevel =
        setup.startingIndentLevel != null ? setup.startingIndentLevel : 0;
      this.writeComments = setup.comments ? setup.comments : false;
      // Source map
      if (setup.sourceMap != null) {
        this.write =
          setup.output == null ? this.writeAndMap : this.writeToStreamAndMap;
        this.sourceMap = setup.sourceMap;
        this.line = 1;
        this.column = 0;
        this.lineEndSize = this.lineEnd.split('\n').length - 1;
        this.mapping = {
          original: null,
          // Uses the entire state to avoid generating ephemeral objects
          generated: this,
          name: undefined,
          source: setup.sourceMap.file || setup.sourceMap._file,
        };
      }
    }

    write(code) {
      this.output += code;
    }

    writeToStream(code) {
      this.output.write(code);
    }

    writeAndMap(code, node) {
      this.output += code;
      this.map(code, node);
    }

    writeToStreamAndMap(code, node) {
      this.output.write(code);
      this.map(code, node);
    }

    map(code, node) {
      if (node != null) {
        const { type } = node;
        if (type[0] === 'L' && type[2] === 'n') {
          // LineComment
          this.column = 0;
          this.line++;
          return
        }
        if (node.loc != null) {
          const { mapping } = this;
          mapping.original = node.loc.start;
          mapping.name = node.name;
          this.sourceMap.addMapping(mapping);
        }
        if (
          (type[0] === 'T' && type[8] === 'E') ||
          (type[0] === 'L' && type[1] === 'i' && typeof node.value === 'string')
        ) {
          // TemplateElement or Literal string node
          const { length } = code;
          let { column, line } = this;
          for (let i = 0; i < length; i++) {
            if (code[i] === '\n') {
              column = 0;
              line++;
            } else {
              column++;
            }
          }
          this.column = column;
          this.line = line;
          return
        }
      }
      const { length } = code;
      const { lineEnd } = this;
      if (length > 0) {
        if (
          this.lineEndSize > 0 &&
          (lineEnd.length === 1
            ? code[length - 1] === lineEnd
            : code.endsWith(lineEnd))
        ) {
          this.line += this.lineEndSize;
          this.column = 0;
        } else {
          this.column += length;
        }
      }
    }

    toString() {
      return this.output
    }
  }

  function generate(node, options) {
    /*
    Returns a string representing the rendered code of the provided AST `node`.
    The `options` are:

    - `indent`: string to use for indentation (defaults to `␣␣`)
    - `lineEnd`: string to use for line endings (defaults to `\n`)
    - `startingIndentLevel`: indent level to start from (defaults to `0`)
    - `comments`: generate comments if `true` (defaults to `false`)
    - `output`: output stream to write the rendered code to (defaults to `null`)
    - `generator`: custom code generator (defaults to `GENERATOR`)
    - `expressionsPrecedence`: custom map of node types and their precedence level (defaults to `EXPRESSIONS_PRECEDENCE`)
    */
    const state = new State(options);
    // Travel through the AST node and generate the code
    state.generator[node.type](node, state);
    return state.output
  }

  var __defProp$y = Object.defineProperty;
  var __defNormalProp$y = (obj, key, value) => key in obj ? __defProp$y(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$y = (obj, key, value) => __defNormalProp$y(obj, typeof key !== "symbol" ? key + "" : key, value);
  const JS_GLOBAL_LITERALS = /* @__PURE__ */ new Set(["Infinity", "NaN", "undefined", "null", "true", "false"]);
  const JS_GLOBAL_OBJECTS = /* @__PURE__ */ new Set([
    "Math",
    "Array",
    "Object",
    "String",
    "Number",
    "Boolean",
    "Date",
    "RegExp",
    "Error",
    "JSON",
    "Promise",
    "Set",
    "Map",
    "WeakSet",
    "WeakMap",
    "Symbol",
    "BigInt",
    "Proxy",
    "Reflect",
    "console",
    "isNaN",
    "isFinite",
    "parseInt",
    "parseFloat",
    "encodeURI",
    "decodeURI",
    "encodeURIComponent",
    "decodeURIComponent"
  ]);
  class ScopeManager {
    constructor() {
      __publicField$y(this, "scopes", []);
      __publicField$y(this, "scopeTypes", []);
      __publicField$y(this, "scopeCounts", /* @__PURE__ */ new Map());
      __publicField$y(this, "contextBoundVars", /* @__PURE__ */ new Set());
      __publicField$y(this, "arrayPatternElements", /* @__PURE__ */ new Set());
      __publicField$y(this, "rootParams", /* @__PURE__ */ new Set());
      __publicField$y(this, "localSeriesVars", /* @__PURE__ */ new Set());
      __publicField$y(this, "varKinds", /* @__PURE__ */ new Map());
      __publicField$y(this, "loopVars", /* @__PURE__ */ new Set());
      __publicField$y(this, "loopVarNames", /* @__PURE__ */ new Map());
      // Map original names to transformed names
      __publicField$y(this, "paramIdCounter", 0);
      __publicField$y(this, "cacheIdCounter", 0);
      __publicField$y(this, "tempVarCounter", 0);
      __publicField$y(this, "taCallIdCounter", 0);
      __publicField$y(this, "userCallIdCounter", 0);
      __publicField$y(this, "hoistingStack", []);
      __publicField$y(this, "suppressHoisting", false);
      __publicField$y(this, "reservedNames", /* @__PURE__ */ new Set());
      this.pushScope("glb");
    }
    get nextParamIdArg() {
      return {
        type: "Identifier",
        name: `'p${this.paramIdCounter++}'`
      };
    }
    get nextCacheIdArg() {
      return {
        type: "Identifier",
        name: `'cache_${this.cacheIdCounter++}'`
      };
    }
    getNextTACallId() {
      return {
        type: "Literal",
        value: `_ta${this.taCallIdCounter++}`
      };
    }
    getNextUserCallId() {
      return {
        type: "Literal",
        value: `_fn${this.userCallIdCounter++}`
      };
    }
    pushScope(type) {
      this.scopes.push(/* @__PURE__ */ new Map());
      this.scopeTypes.push(type);
      this.scopeCounts.set(type, (this.scopeCounts.get(type) || 0) + 1);
    }
    popScope() {
      this.scopes.pop();
      this.scopeTypes.pop();
    }
    getCurrentScopeType() {
      return this.scopeTypes[this.scopeTypes.length - 1];
    }
    getCurrentScopeCount() {
      return this.scopeCounts.get(this.getCurrentScopeType()) || 1;
    }
    addLocalSeriesVar(name) {
      this.localSeriesVars.add(name);
    }
    isLocalSeriesVar(name) {
      return this.localSeriesVars.has(name);
    }
    addContextBoundVar(name, isRootParam = false) {
      this.contextBoundVars.add(name);
      if (isRootParam) {
        this.rootParams.add(name);
      }
    }
    removeContextBoundVar(name) {
      if (this.contextBoundVars.has(name)) {
        this.contextBoundVars.delete(name);
        if (this.rootParams.has(name)) {
          this.rootParams.delete(name);
        }
      }
    }
    addArrayPatternElement(name) {
      this.arrayPatternElements.add(name);
    }
    isContextBound(name) {
      if (JS_GLOBAL_LITERALS.has(name) || JS_GLOBAL_OBJECTS.has(name)) {
        return false;
      }
      return this.contextBoundVars.has(name);
    }
    isArrayPatternElement(name) {
      return this.arrayPatternElements.has(name);
    }
    isRootParam(name) {
      return this.rootParams.has(name);
    }
    addLoopVariable(originalName, transformedName) {
      this.loopVars.add(originalName);
      this.loopVarNames.set(originalName, transformedName);
    }
    getLoopVariableName(name) {
      return this.loopVarNames.get(name);
    }
    isLoopVariable(name) {
      return this.loopVars.has(name);
    }
    addReservedName(name) {
      this.reservedNames.add(name);
    }
    addVariable(name, kind) {
      if (this.isContextBound(name)) {
        return name;
      }
      const currentScope = this.scopes[this.scopes.length - 1];
      const scopeType = this.scopeTypes[this.scopeTypes.length - 1];
      const scopeCount = this.scopeCounts.get(scopeType) || 1;
      const newName = `${scopeType}${scopeCount}_${name}`;
      currentScope.set(name, newName);
      this.varKinds.set(newName, kind);
      return newName;
    }
    getVariable(name) {
      if (this.loopVars.has(name)) {
        const transformedName = this.loopVarNames.get(name);
        if (transformedName) {
          return [transformedName, "let"];
        }
      }
      if (this.isContextBound(name)) {
        return [name, "let"];
      }
      for (let i = this.scopes.length - 1; i >= 0; i--) {
        const scope = this.scopes[i];
        if (scope.has(name)) {
          const scopedName = scope.get(name);
          const kind = this.varKinds.get(scopedName) || "let";
          return [scopedName, kind];
        }
      }
      return [name, "let"];
    }
    generateTempVar() {
      return `temp_${++this.tempVarCounter}`;
    }
    // Hoisting Logic
    enterHoistingScope() {
      this.hoistingStack.push([]);
    }
    exitHoistingScope() {
      return this.hoistingStack.pop() || [];
    }
    addHoistedStatement(stmt) {
      if (this.hoistingStack.length > 0 && !this.suppressHoisting) {
        this.hoistingStack[this.hoistingStack.length - 1].push(stmt);
      }
    }
    setSuppressHoisting(suppress) {
      this.suppressHoisting = suppress;
    }
    shouldSuppressHoisting() {
      return this.suppressHoisting;
    }
    // Helper method to check if a variable exists in any scope
    hasVariableInScope(name) {
      if (this.reservedNames.has(name)) {
        return true;
      }
      for (let i = this.scopes.length - 1; i >= 0; i--) {
        if (this.scopes[i].has(name)) {
          return true;
        }
      }
      if (this.contextBoundVars.has(name)) {
        return true;
      }
      if (this.loopVars.has(name)) {
        return true;
      }
      if (this.localSeriesVars.has(name)) {
        return true;
      }
      return false;
    }
    // Param ID Generator Helper (for hoisting)
    generateParamId() {
      let candidate = `p${this.paramIdCounter++}`;
      while (this.hasVariableInScope(candidate)) {
        candidate = `p${this.paramIdCounter++}`;
      }
      const currentScope = this.scopes[this.scopes.length - 1];
      if (currentScope) {
        currentScope.set(candidate, candidate);
      }
      return candidate;
    }
  }

  // AST walker module for ESTree compatible trees

  // A simple walk is one where you simply specify callbacks to be
  // called on specific nodes. The last two arguments are optional. A
  // simple use would be
  //
  //     walk.simple(myTree, {
  //         Expression: function(node) { ... }
  //     });
  //
  // to do something with all expressions. All ESTree node types
  // can be used to identify node types, as well as Expression and
  // Statement, which denote categories of nodes.
  //
  // The base argument can be used to pass a custom (recursive)
  // walker, and state can be used to give this walked an initial
  // state.

  function simple(node, visitors, baseVisitor, state, override) {
    if (!baseVisitor) { baseVisitor = base
    ; }(function c(node, st, override) {
      var type = override || node.type;
      baseVisitor[type](node, st, c);
      if (visitors[type]) { visitors[type](node, st); }
    })(node, state, override);
  }

  // A recursive walk is one where your functions override the default
  // walkers. They can modify and replace the state parameter that's
  // threaded through the walk, and can opt how and whether to walk
  // their child nodes (by calling their third argument on these
  // nodes).
  function recursive(node, state, funcs, baseVisitor, override) {
    var visitor = funcs ? make(funcs, baseVisitor || undefined) : baseVisitor
    ;(function c(node, st, override) {
      visitor[override || node.type](node, st, c);
    })(node, state, override);
  }

  // Used to create a custom walker. Will fill in all missing node
  // type properties with the defaults.
  function make(funcs, baseVisitor) {
    var visitor = Object.create(baseVisitor || base);
    for (var type in funcs) { visitor[type] = funcs[type]; }
    return visitor
  }

  function skipThrough(node, st, c) { c(node, st); }
  function ignore(_node, _st, _c) {}

  // Node walkers.

  var base = {};

  base.Program = base.BlockStatement = base.StaticBlock = function (node, st, c) {
    for (var i = 0, list = node.body; i < list.length; i += 1)
      {
      var stmt = list[i];

      c(stmt, st, "Statement");
    }
  };
  base.Statement = skipThrough;
  base.EmptyStatement = ignore;
  base.ExpressionStatement = base.ParenthesizedExpression = base.ChainExpression =
    function (node, st, c) { return c(node.expression, st, "Expression"); };
  base.IfStatement = function (node, st, c) {
    c(node.test, st, "Expression");
    c(node.consequent, st, "Statement");
    if (node.alternate) { c(node.alternate, st, "Statement"); }
  };
  base.LabeledStatement = function (node, st, c) { return c(node.body, st, "Statement"); };
  base.BreakStatement = base.ContinueStatement = ignore;
  base.WithStatement = function (node, st, c) {
    c(node.object, st, "Expression");
    c(node.body, st, "Statement");
  };
  base.SwitchStatement = function (node, st, c) {
    c(node.discriminant, st, "Expression");
    for (var i = 0, list = node.cases; i < list.length; i += 1) {
      var cs = list[i];

      c(cs, st);
    }
  };
  base.SwitchCase = function (node, st, c) {
    if (node.test) { c(node.test, st, "Expression"); }
    for (var i = 0, list = node.consequent; i < list.length; i += 1)
      {
      var cons = list[i];

      c(cons, st, "Statement");
    }
  };
  base.ReturnStatement = base.YieldExpression = base.AwaitExpression = function (node, st, c) {
    if (node.argument) { c(node.argument, st, "Expression"); }
  };
  base.ThrowStatement = base.SpreadElement =
    function (node, st, c) { return c(node.argument, st, "Expression"); };
  base.TryStatement = function (node, st, c) {
    c(node.block, st, "Statement");
    if (node.handler) { c(node.handler, st); }
    if (node.finalizer) { c(node.finalizer, st, "Statement"); }
  };
  base.CatchClause = function (node, st, c) {
    if (node.param) { c(node.param, st, "Pattern"); }
    c(node.body, st, "Statement");
  };
  base.WhileStatement = base.DoWhileStatement = function (node, st, c) {
    c(node.test, st, "Expression");
    c(node.body, st, "Statement");
  };
  base.ForStatement = function (node, st, c) {
    if (node.init) { c(node.init, st, "ForInit"); }
    if (node.test) { c(node.test, st, "Expression"); }
    if (node.update) { c(node.update, st, "Expression"); }
    c(node.body, st, "Statement");
  };
  base.ForInStatement = base.ForOfStatement = function (node, st, c) {
    c(node.left, st, "ForInit");
    c(node.right, st, "Expression");
    c(node.body, st, "Statement");
  };
  base.ForInit = function (node, st, c) {
    if (node.type === "VariableDeclaration") { c(node, st); }
    else { c(node, st, "Expression"); }
  };
  base.DebuggerStatement = ignore;

  base.FunctionDeclaration = function (node, st, c) { return c(node, st, "Function"); };
  base.VariableDeclaration = function (node, st, c) {
    for (var i = 0, list = node.declarations; i < list.length; i += 1)
      {
      var decl = list[i];

      c(decl, st);
    }
  };
  base.VariableDeclarator = function (node, st, c) {
    c(node.id, st, "Pattern");
    if (node.init) { c(node.init, st, "Expression"); }
  };

  base.Function = function (node, st, c) {
    if (node.id) { c(node.id, st, "Pattern"); }
    for (var i = 0, list = node.params; i < list.length; i += 1)
      {
      var param = list[i];

      c(param, st, "Pattern");
    }
    c(node.body, st, node.expression ? "Expression" : "Statement");
  };

  base.Pattern = function (node, st, c) {
    if (node.type === "Identifier")
      { c(node, st, "VariablePattern"); }
    else if (node.type === "MemberExpression")
      { c(node, st, "MemberPattern"); }
    else
      { c(node, st); }
  };
  base.VariablePattern = ignore;
  base.MemberPattern = skipThrough;
  base.RestElement = function (node, st, c) { return c(node.argument, st, "Pattern"); };
  base.ArrayPattern = function (node, st, c) {
    for (var i = 0, list = node.elements; i < list.length; i += 1) {
      var elt = list[i];

      if (elt) { c(elt, st, "Pattern"); }
    }
  };
  base.ObjectPattern = function (node, st, c) {
    for (var i = 0, list = node.properties; i < list.length; i += 1) {
      var prop = list[i];

      if (prop.type === "Property") {
        if (prop.computed) { c(prop.key, st, "Expression"); }
        c(prop.value, st, "Pattern");
      } else if (prop.type === "RestElement") {
        c(prop.argument, st, "Pattern");
      }
    }
  };

  base.Expression = skipThrough;
  base.ThisExpression = base.Super = base.MetaProperty = ignore;
  base.ArrayExpression = function (node, st, c) {
    for (var i = 0, list = node.elements; i < list.length; i += 1) {
      var elt = list[i];

      if (elt) { c(elt, st, "Expression"); }
    }
  };
  base.ObjectExpression = function (node, st, c) {
    for (var i = 0, list = node.properties; i < list.length; i += 1)
      {
      var prop = list[i];

      c(prop, st);
    }
  };
  base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration;
  base.SequenceExpression = function (node, st, c) {
    for (var i = 0, list = node.expressions; i < list.length; i += 1)
      {
      var expr = list[i];

      c(expr, st, "Expression");
    }
  };
  base.TemplateLiteral = function (node, st, c) {
    for (var i = 0, list = node.quasis; i < list.length; i += 1)
      {
      var quasi = list[i];

      c(quasi, st);
    }

    for (var i$1 = 0, list$1 = node.expressions; i$1 < list$1.length; i$1 += 1)
      {
      var expr = list$1[i$1];

      c(expr, st, "Expression");
    }
  };
  base.TemplateElement = ignore;
  base.UnaryExpression = base.UpdateExpression = function (node, st, c) {
    c(node.argument, st, "Expression");
  };
  base.BinaryExpression = base.LogicalExpression = function (node, st, c) {
    c(node.left, st, "Expression");
    c(node.right, st, "Expression");
  };
  base.AssignmentExpression = base.AssignmentPattern = function (node, st, c) {
    c(node.left, st, "Pattern");
    c(node.right, st, "Expression");
  };
  base.ConditionalExpression = function (node, st, c) {
    c(node.test, st, "Expression");
    c(node.consequent, st, "Expression");
    c(node.alternate, st, "Expression");
  };
  base.NewExpression = base.CallExpression = function (node, st, c) {
    c(node.callee, st, "Expression");
    if (node.arguments)
      { for (var i = 0, list = node.arguments; i < list.length; i += 1)
        {
          var arg = list[i];

          c(arg, st, "Expression");
        } }
  };
  base.MemberExpression = function (node, st, c) {
    c(node.object, st, "Expression");
    if (node.computed) { c(node.property, st, "Expression"); }
  };
  base.ExportNamedDeclaration = base.ExportDefaultDeclaration = function (node, st, c) {
    if (node.declaration)
      { c(node.declaration, st, node.type === "ExportNamedDeclaration" || node.declaration.id ? "Statement" : "Expression"); }
    if (node.source) { c(node.source, st, "Expression"); }
  };
  base.ExportAllDeclaration = function (node, st, c) {
    if (node.exported)
      { c(node.exported, st); }
    c(node.source, st, "Expression");
  };
  base.ImportDeclaration = function (node, st, c) {
    for (var i = 0, list = node.specifiers; i < list.length; i += 1)
      {
      var spec = list[i];

      c(spec, st);
    }
    c(node.source, st, "Expression");
  };
  base.ImportExpression = function (node, st, c) {
    c(node.source, st, "Expression");
  };
  base.ImportSpecifier = base.ImportDefaultSpecifier = base.ImportNamespaceSpecifier = base.Identifier = base.PrivateIdentifier = base.Literal = ignore;

  base.TaggedTemplateExpression = function (node, st, c) {
    c(node.tag, st, "Expression");
    c(node.quasi, st, "Expression");
  };
  base.ClassDeclaration = base.ClassExpression = function (node, st, c) { return c(node, st, "Class"); };
  base.Class = function (node, st, c) {
    if (node.id) { c(node.id, st, "Pattern"); }
    if (node.superClass) { c(node.superClass, st, "Expression"); }
    c(node.body, st);
  };
  base.ClassBody = function (node, st, c) {
    for (var i = 0, list = node.body; i < list.length; i += 1)
      {
      var elt = list[i];

      c(elt, st);
    }
  };
  base.MethodDefinition = base.PropertyDefinition = base.Property = function (node, st, c) {
    if (node.computed) { c(node.key, st, "Expression"); }
    if (node.value) { c(node.value, st, "Expression"); }
  };

  const CONTEXT_NAME = "$";
  const ASTFactory = {
    createIdentifier(name) {
      return {
        type: "Identifier",
        name
      };
    },
    createLiteral(value) {
      return {
        type: "Literal",
        value
      };
    },
    createMemberExpression(object, property, computed = false) {
      return {
        type: "MemberExpression",
        object,
        property,
        computed
      };
    },
    createContextIdentifier() {
      return this.createIdentifier(CONTEXT_NAME);
    },
    // Create $.kind.name
    createContextVariableReference(kind, name) {
      const context = this.createContextIdentifier();
      const kindId = this.createIdentifier(kind);
      const nameId = this.createIdentifier(name);
      return this.createMemberExpression(this.createMemberExpression(context, kindId, false), nameId, false);
    },
    // Create $.get($.kind.name, 0)
    createContextVariableAccess0(kind, name) {
      const varRef = this.createContextVariableReference(kind, name);
      return this.createGetCall(varRef, 0);
    },
    createArrayAccess(object, index) {
      const indexNode = typeof index === "number" ? this.createLiteral(index) : index;
      return this.createMemberExpression(object, indexNode, true);
    },
    createCallExpression(callee, args) {
      return {
        type: "CallExpression",
        callee,
        arguments: args
      };
    },
    createAssignmentExpression(left, right, operator = "=") {
      return {
        type: "AssignmentExpression",
        operator,
        left,
        right
      };
    },
    createExpressionStatement(expression) {
      return {
        type: "ExpressionStatement",
        expression
      };
    },
    createInitCall(targetVarRef, value, lookbehind) {
      const initMethod = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier("init"), false);
      const args = [targetVarRef, value];
      if (lookbehind) {
        args.push(lookbehind);
      }
      return this.createCallExpression(initMethod, args);
    },
    createInitVarCall(targetVarRef, value) {
      const initMethod = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier("initVar"), false);
      const args = [targetVarRef, value];
      return this.createCallExpression(initMethod, args);
    },
    // Create $.get(source, index)
    createGetCall(source, index) {
      const getMethod = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier("get"), false);
      const indexNode = typeof index === "number" ? this.createLiteral(index) : index;
      return this.createCallExpression(getMethod, [source, indexNode]);
    },
    // Create $.set(target, value)
    createSetCall(target, value) {
      const setMethod = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier("set"), false);
      return this.createCallExpression(setMethod, [target, value]);
    },
    // Create $.math.__eq(left, right)
    createMathEqCall(left, right) {
      const mathObj = this.createMemberExpression(this.createContextIdentifier(), this.createIdentifier("math"), false);
      const eqMethod = this.createMemberExpression(mathObj, this.createIdentifier("__eq"), false);
      return this.createCallExpression(eqMethod, [left, right]);
    },
    createWrapperFunction(body) {
      return {
        type: "FunctionDeclaration",
        id: null,
        params: [this.createIdentifier("context")],
        body: {
          type: "BlockStatement",
          body: [
            {
              type: "ReturnStatement",
              argument: body
            }
          ]
        }
      };
    },
    createVariableDeclaration(name, init) {
      return {
        type: "VariableDeclaration",
        kind: "const",
        declarations: [
          {
            type: "VariableDeclarator",
            id: this.createIdentifier(name),
            init
          }
        ]
      };
    },
    createAwaitExpression(argument) {
      return {
        type: "AwaitExpression",
        argument
      };
    }
  };

  const KNOWN_NAMESPACES = ["ta", "math", "request", "array", "input"];
  const NAMESPACES_LIKE = ["hline", "plot", "fill"];
  const ASYNC_METHODS = ["request.security", "request.security_lower_tf"];
  const CONTEXT_DATA_VARS = ["open", "high", "low", "close", "volume", "hl2", "hlc3", "ohlc4", "openTime", "closeTime"];
  const CONTEXT_PINE_VARS = [
    //namespaces
    ...KNOWN_NAMESPACES,
    //plots
    "plotchar",
    "plotshape",
    "plotarrow",
    "plotbar",
    "plotcandle",
    "plot",
    "bgcolor",
    "barcolor",
    "hline",
    "fill",
    //declarations
    "indicator",
    "strategy",
    "library",
    //
    "alertcondition",
    "fixnan",
    "na",
    "color",
    "nz",
    "str",
    "box",
    "line",
    "label",
    "table",
    "map",
    "matrix",
    "log",
    "map",
    //types
    "Type",
    //UDT
    "bool",
    //market info
    "timeframe",
    "ticker",
    "syminfo",
    "barstate",
    //builtin variables
    "bar_index",
    "last_bar_index",
    "last_bar_time",
    "inputs",
    // Pine Script enum types
    "order",
    "currency",
    "display",
    "shape",
    "location",
    "size",
    "format",
    "dayofweek"
  ];
  const CONTEXT_CORE_VARS = ["na", "nz", "plot", "plotchar", "color", "hline", "fill"];

  function injectImplicitImports(ast) {
    let mainBody = null;
    let contextParamName = CONTEXT_NAME;
    if (ast.type === "Program" && ast.body.length > 0) {
      const firstStmt = ast.body[0];
      if (firstStmt.type === "ExpressionStatement" && (firstStmt.expression.type === "ArrowFunctionExpression" || firstStmt.expression.type === "FunctionExpression")) {
        const fn = firstStmt.expression;
        if (fn.body.type === "BlockStatement") {
          mainBody = fn.body.body;
          if (fn.params.length > 0 && fn.params[0].type === "Identifier") {
            contextParamName = fn.params[0].name;
          }
        }
      }
    }
    if (!mainBody) return;
    const declaredVars = /* @__PURE__ */ new Set();
    const usedIdentifiers = /* @__PURE__ */ new Set();
    const addDeclared = (pattern) => {
      if (pattern.type === "Identifier") {
        declaredVars.add(pattern.name);
      } else if (pattern.type === "ObjectPattern") {
        pattern.properties.forEach((p) => addDeclared(p.value));
      } else if (pattern.type === "ArrayPattern") {
        pattern.elements.forEach((e) => {
          if (e) addDeclared(e);
        });
      }
    };
    recursive(
      ast,
      {},
      {
        VariableDeclarator(node, state, c) {
          addDeclared(node.id);
          if (node.init) c(node.init, state);
        },
        FunctionDeclaration(node, state, c) {
          addDeclared(node.id);
          c(node.body, state);
        },
        Identifier(node, state, c) {
          usedIdentifiers.add(node.name);
        },
        MemberExpression(node, state, c) {
          c(node.object, state);
          if (node.computed) {
            c(node.property, state);
          }
        },
        Property(node, state, c) {
          if (node.computed) {
            c(node.key, state);
          }
          c(node.value, state);
        }
      }
    );
    mainBody.forEach((stmt) => {
      if (stmt.type === "VariableDeclaration") {
        stmt.declarations.forEach((d) => addDeclared(d.id));
      } else if (stmt.type === "FunctionDeclaration") {
        addDeclared(stmt.id);
      }
    });
    const contextDataVars = CONTEXT_DATA_VARS;
    const contextPineVars = CONTEXT_PINE_VARS;
    const missingDataVars = contextDataVars.filter((v) => !declaredVars.has(v));
    const missingPineVars = contextPineVars.filter((v) => !declaredVars.has(v));
    const neededDataVars = missingDataVars.filter((v) => usedIdentifiers.has(v));
    const neededPineVars = missingPineVars.filter((v) => usedIdentifiers.has(v));
    const injections = [];
    if (neededDataVars.length > 0) {
      injections.push({
        type: "VariableDeclaration",
        kind: "const",
        declarations: [
          {
            type: "VariableDeclarator",
            id: {
              type: "ObjectPattern",
              properties: neededDataVars.map((name) => ({
                type: "Property",
                key: { type: "Identifier", name },
                value: { type: "Identifier", name },
                kind: "init",
                shorthand: true
              }))
            },
            init: {
              type: "MemberExpression",
              object: { type: "Identifier", name: contextParamName },
              property: { type: "Identifier", name: "data" },
              computed: false
            }
          }
        ]
      });
    }
    if (neededPineVars.length > 0) {
      injections.push({
        type: "VariableDeclaration",
        kind: "const",
        declarations: [
          {
            type: "VariableDeclarator",
            id: {
              type: "ObjectPattern",
              properties: neededPineVars.map((name) => ({
                type: "Property",
                key: { type: "Identifier", name },
                value: { type: "Identifier", name },
                kind: "init",
                shorthand: true
              }))
            },
            init: {
              type: "MemberExpression",
              object: { type: "Identifier", name: contextParamName },
              property: { type: "Identifier", name: "pine" },
              computed: false
            }
          }
        ]
      });
    }
    if (injections.length > 0) {
      mainBody.unshift(...injections);
    }
  }

  function normalizeNativeImports(ast) {
    let mainBody = null;
    let contextParamName = CONTEXT_NAME;
    if (ast.type === "Program" && ast.body.length > 0) {
      const firstStmt = ast.body[0];
      if (firstStmt.type === "ExpressionStatement" && (firstStmt.expression.type === "ArrowFunctionExpression" || firstStmt.expression.type === "FunctionExpression")) {
        const fn = firstStmt.expression;
        if (fn.body.type === "BlockStatement") {
          mainBody = fn.body.body;
          if (fn.params.length > 0 && fn.params[0].type === "Identifier") {
            contextParamName = fn.params[0].name;
          }
        }
      }
    }
    if (!mainBody) return;
    const contextDataVars = new Set(CONTEXT_DATA_VARS);
    const contextPineVars = new Set(CONTEXT_PINE_VARS);
    const contextCoreVars = new Set(CONTEXT_CORE_VARS);
    const renames = /* @__PURE__ */ new Map();
    mainBody.forEach((stmt) => {
      if (stmt.type === "VariableDeclaration") {
        stmt.declarations.forEach((decl) => {
          if (decl.init && decl.init.type === "MemberExpression" && decl.init.object.type === "Identifier" && decl.init.object.name === contextParamName && decl.init.property.type === "Identifier") {
            const sourceName = decl.init.property.name;
            let validNames = null;
            if (sourceName === "data") {
              validNames = contextDataVars;
            } else if (sourceName === "pine") {
              validNames = contextPineVars;
            } else if (sourceName === "core") {
              validNames = contextCoreVars;
            }
            if (validNames && decl.id.type === "ObjectPattern") {
              decl.id.properties.forEach((prop) => {
                if (prop.type === "Property" && prop.key.type === "Identifier" && prop.value.type === "Identifier") {
                  const originalName = prop.key.name;
                  const aliasName = prop.value.name;
                  if (validNames.has(originalName) && originalName !== aliasName) {
                    renames.set(aliasName, originalName);
                    prop.value.name = originalName;
                    prop.shorthand = true;
                  }
                }
              });
            } else if (decl.id.type === "Identifier") {
              if (KNOWN_NAMESPACES.includes(sourceName)) {
                const originalName = sourceName;
                const aliasName = decl.id.name;
                if (originalName !== aliasName) {
                  renames.set(aliasName, originalName);
                  decl.id.name = originalName;
                }
              }
            }
          }
        });
      }
    });
    if (renames.size > 0) {
      recursive(
        ast,
        {},
        {
          Identifier(node) {
            if (renames.has(node.name)) {
              node.name = renames.get(node.name);
            }
          },
          // Prevent renaming of non-computed property keys
          MemberExpression(node, state, c) {
            c(node.object, state);
            if (node.computed) {
              c(node.property, state);
            }
          },
          Property(node, state, c) {
            if (node.computed) {
              c(node.key, state);
            }
            c(node.value, state);
          }
        }
      );
    }
  }

  function checkFunctionWrapping(code) {
    try {
      const ast = parse(code, {
        ecmaVersion: "latest",
        sourceType: "module"
      });
      if (ast.type === "Program" && ast.body.length === 1) {
        const firstStatement = ast.body[0];
        if (firstStatement.type === "ExpressionStatement") {
          const expr = firstStatement.expression;
          if (expr.type === "ArrowFunctionExpression" || expr.type === "FunctionExpression") {
            return { isWrapped: true, isAsync: expr.async || false, functionNode: expr };
          }
        }
        if (firstStatement.type === "FunctionDeclaration") {
          return { isWrapped: true, isAsync: firstStatement.async || false, functionNode: firstStatement };
        }
      }
      return { isWrapped: false, isAsync: false };
    } catch (e) {
      return { isWrapped: false, isAsync: false };
    }
  }
  function convertToAsync(functionNode) {
    functionNode.async = true;
    return generate(functionNode);
  }
  function wrapInContextFunction(code) {
    code = code.trim();
    const { isWrapped, isAsync, functionNode } = checkFunctionWrapping(code);
    if (isWrapped && functionNode) {
      if (!isAsync) {
        return convertToAsync(functionNode);
      }
      return code;
    }
    return `async (context) => {
${code}
}`;
  }

  function transformNestedArrowFunctions(ast) {
    recursive(ast, null, {
      VariableDeclaration(node, state, c) {
        if (node.declarations && node.declarations.length > 0) {
          const declarations = node.declarations;
          declarations.forEach((decl) => {
            if (decl.init && decl.init.type === "ArrowFunctionExpression") {
              const isRootFunction = decl.init.start === 0;
              if (!isRootFunction) {
                const functionDeclaration = {
                  type: "FunctionDeclaration",
                  id: decl.id,
                  // Use the variable name as function name
                  params: decl.init.params,
                  body: decl.init.body.type === "BlockStatement" ? decl.init.body : {
                    type: "BlockStatement",
                    body: [
                      {
                        type: "ReturnStatement",
                        argument: decl.init.body
                      }
                    ]
                  },
                  async: decl.init.async,
                  generator: false
                };
                Object.assign(node, functionDeclaration);
              }
            }
          });
        }
        if (node.body && node.body.body) {
          node.body.body.forEach((stmt) => c(stmt, state));
        }
      }
    });
  }
  function preProcessContextBoundVars(ast, scopeManager) {
    simple(ast, {
      VariableDeclaration(node) {
        node.declarations.forEach((decl) => {
          const isContextProperty = decl.init && decl.init.type === "MemberExpression" && decl.init.object && (decl.init.object.name === "context" || decl.init.object.name === CONTEXT_NAME || decl.init.object.name === "context2");
          const isSubContextProperty = decl.init && decl.init.type === "MemberExpression" && decl.init.object?.object && (decl.init.object.object.name === "context" || decl.init.object.object.name === CONTEXT_NAME || decl.init.object.object.name === "context2");
          if (isContextProperty || isSubContextProperty) {
            if (decl.id.name) {
              scopeManager.addContextBoundVar(decl.id.name);
            }
            if (decl.id.properties) {
              decl.id.properties.forEach((property) => {
                if (property.key.name) {
                  scopeManager.addContextBoundVar(property.key.name);
                }
              });
            }
          }
        });
      }
    });
  }
  function transformArrowFunctionParams(node, scopeManager, isRootFunction = false) {
    node.params.forEach((param) => {
      if (param.type === "Identifier") {
        scopeManager.addContextBoundVar(param.name, isRootFunction);
      }
    });
  }
  function registerFunctionParameters(node, scopeManager) {
    node.params.forEach((param) => {
      if (param.type === "Identifier") {
        scopeManager.addContextBoundVar(param.name, false);
      }
    });
  }
  function runAnalysisPass(ast, scopeManager) {
    let originalParamName;
    simple(ast, {
      FunctionDeclaration(node) {
        registerFunctionParameters(node, scopeManager);
        if (node.id && node.id.name) {
          scopeManager.addReservedName(node.id.name);
        }
      },
      ArrowFunctionExpression(node) {
        const isRootFunction = node.start === 0;
        if (isRootFunction && node.params && node.params.length > 0) {
          originalParamName = node.params[0].name;
          node.params[0].name = CONTEXT_NAME;
        }
        transformArrowFunctionParams(node, scopeManager, isRootFunction);
      },
      VariableDeclaration(node) {
        node.declarations.forEach((decl) => {
          if (decl.id.type === "Identifier") {
            scopeManager.addReservedName(decl.id.name);
          } else if (decl.id.type === "ObjectPattern") {
            decl.id.properties.forEach((prop) => {
              if (prop.key && prop.key.type === "Identifier") {
                scopeManager.addReservedName(prop.key.name);
              }
            });
          } else if (decl.id.type === "ArrayPattern") {
            decl.id.elements?.forEach((element) => {
              if (element && element.type === "Identifier") {
                scopeManager.addReservedName(element.name);
              }
            });
            const tempVarName = scopeManager.generateTempVar();
            const tempVarDecl = {
              type: "VariableDeclaration",
              kind: node.kind,
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: {
                    type: "Identifier",
                    name: tempVarName
                  },
                  init: decl.init
                }
              ]
            };
            decl.id.elements?.forEach((element) => {
              if (element.type === "Identifier") {
                scopeManager.addArrayPatternElement(element.name);
              }
            });
            const individualDecls = decl.id.elements.map((element, index) => ({
              type: "VariableDeclaration",
              kind: node.kind,
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: element,
                  init: {
                    type: "MemberExpression",
                    object: {
                      type: "Identifier",
                      name: tempVarName
                    },
                    property: {
                      type: "Literal",
                      value: index
                    },
                    computed: true
                  }
                }
              ]
            }));
            Object.assign(node, {
              type: "BlockStatement",
              body: [tempVarDecl, ...individualDecls]
            });
          }
        });
      },
      ForStatement(node) {
      }
    });
    return originalParamName;
  }

  const UNDEFINED_ARG = {
    type: "Identifier",
    name: "undefined"
  };
  function transformArrayIndex(node, scopeManager) {
    if (node.computed && node.property.type === "Identifier") {
      if (scopeManager.isLoopVariable(node.property.name)) {
        if (node.object.type === "Identifier" && !scopeManager.isLoopVariable(node.object.name)) {
          if (!scopeManager.isContextBound(node.object.name)) {
            const [scopedName, kind] = scopeManager.getVariable(node.object.name);
            const contextVarRef = ASTFactory.createContextVariableReference(kind, scopedName);
            const getCall = ASTFactory.createGetCall(contextVarRef, node.property);
            Object.assign(node, getCall);
            node._indexTransformed = true;
          }
        }
        return;
      }
      if (!scopeManager.isContextBound(node.property.name)) {
        const [scopedName, kind] = scopeManager.getVariable(node.property.name);
        node.property = ASTFactory.createContextVariableReference(kind, scopedName);
        node.property = ASTFactory.createGetCall(node.property, 0);
      }
    }
    if (node.computed && node.object.type === "Identifier") {
      if (scopeManager.isLoopVariable(node.object.name)) {
        return;
      }
      if (!scopeManager.isContextBound(node.object.name)) {
        const [scopedName, kind] = scopeManager.getVariable(node.object.name);
        node.object = ASTFactory.createContextVariableReference(kind, scopedName);
      }
      if (node.property.type === "MemberExpression") {
        const memberNode = node.property;
        if (!memberNode._indexTransformed) {
          transformArrayIndex(memberNode, scopeManager);
          memberNode._indexTransformed = true;
        }
      }
    }
  }
  function addArrayAccess(node, scopeManager) {
    const memberExpr = ASTFactory.createGetCall(ASTFactory.createIdentifier(node.name), 0);
    if (node.start !== void 0) memberExpr.start = node.start;
    if (node.end !== void 0) memberExpr.end = node.end;
    memberExpr._indexTransformed = true;
    Object.assign(node, memberExpr);
  }
  function transformIdentifier(node, scopeManager) {
    if (node.name !== CONTEXT_NAME) {
      if (node.name === "na") {
        const isFunctionCall2 = node.parent && node.parent.type === "CallExpression" && node.parent.callee === node;
        if (!isFunctionCall2) {
          node.name = "NaN";
          return;
        }
      }
      if (node.name === "Math" || node.name === "NaN" || node.name === "undefined" || node.name === "Infinity" || node.name === "null" || node.name.startsWith("'") && node.name.endsWith("'") || node.name.startsWith('"') && node.name.endsWith('"') || node.name.startsWith("`") && node.name.endsWith("`")) {
        return;
      }
      if (scopeManager.isLoopVariable(node.name)) {
        return;
      }
      let isSeriesFunctionArg = false;
      if (node.parent && node.parent.type === "CallExpression" && node.parent.arguments.includes(node)) {
        const callee = node.parent.callee;
        const isContextMethod = callee.type === "MemberExpression" && callee.object && callee.object.name === CONTEXT_NAME && ["get", "set", "init", "param", "call"].includes(callee.property.name);
        if (isContextMethod) {
          const argIndex = node.parent.arguments.indexOf(node);
          if (callee.property.name === "call") {
            if (argIndex >= 2) {
              isSeriesFunctionArg = true;
            }
          } else if (argIndex === 0) {
            isSeriesFunctionArg = true;
          }
        } else {
          const isNamespaceCall = callee.type === "MemberExpression" && callee.object && callee.object.type === "Identifier" && KNOWN_NAMESPACES.includes(callee.object.name);
          if (callee.type === "MemberExpression" && !isNamespaceCall) {
            isSeriesFunctionArg = false;
          } else {
            isSeriesFunctionArg = true;
          }
        }
      }
      const isNamespaceMember = node.parent && node.parent.type === "MemberExpression" && node.parent.object === node && scopeManager.isContextBound(node.name);
      const isParamCall = node.parent && node.parent.type === "CallExpression" && node.parent.callee && node.parent.callee.type === "MemberExpression" && node.parent.callee.property.name === "param";
      node.parent && node.parent.type === "AssignmentExpression" && node.parent.left === node;
      const isFunctionCall = node.parent && node.parent.type === "CallExpression" && node.parent.callee === node;
      const hasArrayAccess = node.parent && node.parent.type === "MemberExpression" && node.parent.computed && node.parent.object === node;
      const isArrayIndexInNamespaceCall = node.parent && node.parent.type === "MemberExpression" && node.parent.computed && node.parent.property === node && node.parent.parent && node.parent.parent.type === "CallExpression" && node.parent.parent.callee && node.parent.parent.callee.type === "MemberExpression" && scopeManager.isContextBound(node.parent.parent.callee.object.name);
      if (isNamespaceMember || isParamCall || isSeriesFunctionArg || isArrayIndexInNamespaceCall || isFunctionCall) {
        if (isFunctionCall) {
          return;
        }
        if (scopeManager.isLocalSeriesVar(node.name)) {
          return;
        }
        if (scopeManager.isContextBound(node.name) && !scopeManager.isRootParam(node.name)) {
          return;
        }
        const [scopedName2, kind2] = scopeManager.getVariable(node.name);
        const memberExpr2 = ASTFactory.createContextVariableReference(kind2, scopedName2);
        Object.assign(node, memberExpr2);
        return;
      }
      const isContextBoundVar = scopeManager.isContextBound(node.name) && !scopeManager.isRootParam(node.name);
      if (isContextBoundVar) {
        const isFunctionArg = node.parent && node.parent.type === "CallExpression" && node.parent.arguments.includes(node);
        if (!isFunctionArg) {
          return;
        }
      }
      if (scopeManager.isLocalSeriesVar(node.name)) {
        if (!hasArrayAccess) {
          const memberExpr2 = ASTFactory.createIdentifier(node.name);
          const accessExpr = ASTFactory.createGetCall(memberExpr2, 0);
          Object.assign(node, accessExpr);
        }
        return;
      }
      const [scopedName, kind] = scopeManager.getVariable(node.name);
      let memberExpr;
      if (isContextBoundVar) {
        memberExpr = ASTFactory.createIdentifier(node.name);
      } else {
        if (scopedName === node.name && !scopeManager.isContextBound(node.name)) {
          return;
        }
        memberExpr = ASTFactory.createContextVariableReference(kind, scopedName);
      }
      if (!hasArrayAccess) {
        const accessExpr = ASTFactory.createGetCall(memberExpr, 0);
        Object.assign(node, accessExpr);
      } else {
        Object.assign(node, memberExpr);
      }
    }
  }
  function transformMemberExpression(memberNode, originalParamName, scopeManager) {
    if (memberNode.object && memberNode.object.type === "Identifier" && memberNode.object.name === "Math") {
      return;
    }
    const isDirectNamespaceMemberAccess = memberNode.object && memberNode.object.type === "Identifier" && KNOWN_NAMESPACES.includes(memberNode.object.name) && scopeManager.isContextBound(memberNode.object.name) && !memberNode.computed;
    if (isDirectNamespaceMemberAccess) {
      const isAlreadyBeingCalled = memberNode.parent && memberNode.parent.type === "CallExpression" && memberNode.parent.callee === memberNode;
      const isInDestructuring = memberNode.parent && (memberNode.parent.type === "VariableDeclarator" || memberNode.parent.type === "Property" || memberNode.parent.type === "AssignmentExpression");
      if (!isAlreadyBeingCalled && !isInDestructuring) {
        const callExpr = {
          type: "CallExpression",
          callee: {
            type: "MemberExpression",
            object: memberNode.object,
            property: memberNode.property,
            computed: false
          },
          arguments: [],
          _transformed: false
          // Allow further transformation of this call
        };
        if (memberNode.start !== void 0) callExpr.start = memberNode.start;
        if (memberNode.end !== void 0) callExpr.end = memberNode.end;
        Object.assign(memberNode, callExpr);
        return;
      }
    }
    const isIfStatement = scopeManager.getCurrentScopeType() == "if";
    const isElseStatement = scopeManager.getCurrentScopeType() == "els";
    const isForStatement = scopeManager.getCurrentScopeType() == "for";
    if (!isIfStatement && !isElseStatement && !isForStatement && memberNode.object && memberNode.object.type === "Identifier" && scopeManager.isContextBound(memberNode.object.name) && !scopeManager.isRootParam(memberNode.object.name) && !memberNode.computed) {
      return;
    }
    if (!memberNode._indexTransformed) {
      transformArrayIndex(memberNode, scopeManager);
      memberNode._indexTransformed = true;
    }
    const isContextMemberAccess = memberNode.object && memberNode.object.type === "MemberExpression" && memberNode.object.object && memberNode.object.object.type === "MemberExpression" && memberNode.object.object.object && memberNode.object.object.object.name === CONTEXT_NAME;
    const isContextBoundIdentifier = memberNode.object && memberNode.object.type === "Identifier" && scopeManager.isContextBound(memberNode.object.name);
    if (memberNode.computed && (isContextMemberAccess || isContextBoundIdentifier)) {
      if (memberNode.parent && memberNode.parent.type === "AssignmentExpression" && memberNode.parent.left === memberNode) {
        return;
      }
      const getCall = ASTFactory.createGetCall(memberNode.object, memberNode.property);
      if (memberNode.start) getCall.start = memberNode.start;
      if (memberNode.end) getCall.end = memberNode.end;
      Object.assign(memberNode, getCall);
      delete memberNode.object;
      delete memberNode.property;
      delete memberNode.computed;
    }
  }
  function transformIdentifierForParam(node, scopeManager) {
    if (node.type === "Identifier") {
      if (node.name === "na") {
        node.name = "NaN";
        return node;
      }
      if (scopeManager.isLoopVariable(node.name)) {
        return node;
      }
      if (scopeManager.isRootParam(node.name)) {
        const [scopedName2, kind2] = scopeManager.getVariable(node.name);
        return ASTFactory.createContextVariableReference(kind2, scopedName2);
      }
      if (scopeManager.isContextBound(node.name)) {
        return node;
      }
      const [scopedName, kind] = scopeManager.getVariable(node.name);
      const isUserVariable = scopedName !== node.name;
      if (scopeManager.isLocalSeriesVar(node.name) && !isUserVariable) {
        return node;
      }
      if (isUserVariable) {
        return ASTFactory.createContextVariableReference(kind, scopedName);
      }
      if (scopedName === node.name && !scopeManager.isContextBound(node.name)) {
        return node;
      }
      return ASTFactory.createContextVariableReference(kind, scopedName);
    }
    return node;
  }
  function transformOperand(node, scopeManager, namespace = "") {
    switch (node.type) {
      case "BinaryExpression": {
        return getParamFromBinaryExpression(node, scopeManager, namespace);
      }
      case "LogicalExpression": {
        return getParamFromLogicalExpression(node, scopeManager, namespace);
      }
      case "MemberExpression": {
        const transformedObject = node.object.type === "Identifier" ? transformIdentifierForParam(node.object, scopeManager) : node.object;
        return {
          type: "MemberExpression",
          object: transformedObject,
          property: node.property,
          computed: node.computed
        };
      }
      case "Identifier": {
        if (scopeManager.isLoopVariable(node.name)) {
          return node;
        }
        const isMemberExprProperty = node.parent && node.parent.type === "MemberExpression" && node.parent.property === node;
        if (isMemberExprProperty) {
          return node;
        }
        const transformedObject = transformIdentifierForParam(node, scopeManager);
        if (transformedObject.type === "Identifier" && (transformedObject.name === "NaN" || transformedObject.name === "undefined" || transformedObject.name === "Infinity" || transformedObject.name === "null" || transformedObject.name === "Math")) {
          return transformedObject;
        }
        return ASTFactory.createGetCall(transformedObject, 0);
      }
      case "UnaryExpression": {
        return getParamFromUnaryExpression(node, scopeManager, namespace);
      }
      case "ConditionalExpression": {
        const transformedTest = transformOperand(node.test, scopeManager, namespace);
        const transformedConsequent = transformOperand(node.consequent, scopeManager, namespace);
        const transformedAlternate = transformOperand(node.alternate, scopeManager, namespace);
        return {
          type: "ConditionalExpression",
          test: transformedTest,
          consequent: transformedConsequent,
          alternate: transformedAlternate,
          start: node.start,
          end: node.end
        };
      }
    }
    return node;
  }
  function getParamFromBinaryExpression(node, scopeManager, namespace) {
    const transformedLeft = transformOperand(node.left, scopeManager, namespace);
    const transformedRight = transformOperand(node.right, scopeManager, namespace);
    const binaryExpr = {
      type: "BinaryExpression",
      operator: node.operator,
      left: transformedLeft,
      right: transformedRight,
      start: node.start,
      end: node.end
    };
    recursive(binaryExpr, scopeManager, {
      CallExpression(node2, scopeManager2) {
        if (!node2._transformed) {
          transformCallExpression(node2, scopeManager2);
        }
      },
      MemberExpression(node2) {
        transformMemberExpression(node2, "", scopeManager);
      }
    });
    return binaryExpr;
  }
  function getParamFromLogicalExpression(node, scopeManager, namespace) {
    const transformedLeft = transformOperand(node.left, scopeManager, namespace);
    const transformedRight = transformOperand(node.right, scopeManager, namespace);
    const logicalExpr = {
      type: "LogicalExpression",
      operator: node.operator,
      left: transformedLeft,
      right: transformedRight,
      start: node.start,
      end: node.end
    };
    recursive(logicalExpr, scopeManager, {
      CallExpression(node2, scopeManager2) {
        if (!node2._transformed) {
          transformCallExpression(node2, scopeManager2);
        }
      }
    });
    return logicalExpr;
  }
  function getParamFromConditionalExpression(node, scopeManager, namespace) {
    recursive(
      node,
      { parent: node, inNamespaceCall: false },
      {
        Identifier(node2, state, c) {
          if (node2.name == "NaN") return;
          if (node2.name == "na") {
            node2.name = "NaN";
            return;
          }
          node2.parent = state.parent;
          transformIdentifier(node2, scopeManager);
          const isBinaryOperation = node2.parent && node2.parent.type === "BinaryExpression";
          const isConditional = node2.parent && node2.parent.type === "ConditionalExpression";
          if (isConditional || isBinaryOperation) {
            if (node2.type === "MemberExpression") {
              transformArrayIndex(node2, scopeManager);
            } else if (node2.type === "Identifier") {
              const isGetCall = node2.parent && node2.parent.type === "CallExpression" && node2.parent.callee && node2.parent.callee.object && node2.parent.callee.object.name === CONTEXT_NAME && node2.parent.callee.property.name === "get";
              if (!isGetCall) {
                addArrayAccess(node2);
              }
            }
          }
        },
        MemberExpression(node2, state, c) {
          transformArrayIndex(node2, scopeManager);
          if (node2.object) {
            c(node2.object, { parent: node2, inNamespaceCall: state.inNamespaceCall });
          }
        },
        ConditionalExpression(node2, state, c) {
          const newState = { ...state, parent: node2 };
          if (node2.test) {
            c(node2.test, newState);
          }
          if (node2.consequent) {
            c(node2.consequent, newState);
          }
          if (node2.alternate) {
            c(node2.alternate, newState);
          }
        },
        BinaryExpression(node2, state, c) {
          const newState = { ...state, parent: node2 };
          c(node2.left, newState);
          c(node2.right, newState);
        },
        LogicalExpression(node2, state, c) {
          const newState = { ...state, parent: node2 };
          c(node2.left, newState);
          c(node2.right, newState);
        },
        UnaryExpression(node2, state, c) {
          const newState = { ...state, parent: node2 };
          c(node2.argument, newState);
        },
        CallExpression(node2, state, c) {
          const isNamespaceCall = node2.callee && node2.callee.type === "MemberExpression" && node2.callee.object && node2.callee.object.type === "Identifier" && scopeManager.isContextBound(node2.callee.object.name);
          transformCallExpression(node2, scopeManager);
          node2.arguments.forEach((arg) => c(arg, { parent: node2, inNamespaceCall: isNamespaceCall || state.inNamespaceCall }));
        }
      }
    );
    const memberExpr = ASTFactory.createMemberExpression(ASTFactory.createIdentifier(namespace), ASTFactory.createIdentifier("param"));
    const nextParamId = scopeManager.generateParamId();
    const paramCall = {
      type: "CallExpression",
      callee: memberExpr,
      arguments: [node, UNDEFINED_ARG, { type: "Identifier", name: `'${nextParamId}'` }],
      _transformed: true,
      _isParamCall: true
    };
    if (!scopeManager.shouldSuppressHoisting()) {
      const tempVarName = nextParamId;
      scopeManager.addLocalSeriesVar(tempVarName);
      const variableDecl = ASTFactory.createVariableDeclaration(tempVarName, paramCall);
      scopeManager.addHoistedStatement(variableDecl);
      return ASTFactory.createIdentifier(tempVarName);
    }
    return paramCall;
  }
  function getParamFromUnaryExpression(node, scopeManager, namespace) {
    const transformedArgument = transformOperand(node.argument, scopeManager, namespace);
    const unaryExpr = {
      type: "UnaryExpression",
      operator: node.operator,
      prefix: node.prefix,
      argument: transformedArgument,
      start: node.start,
      end: node.end
    };
    return unaryExpr;
  }
  function transformFunctionArgument(arg, namespace, scopeManager) {
    switch (arg?.type) {
      case "BinaryExpression":
        arg = getParamFromBinaryExpression(arg, scopeManager, namespace);
        break;
      case "LogicalExpression":
        arg = getParamFromLogicalExpression(arg, scopeManager, namespace);
        break;
      case "ConditionalExpression":
        return getParamFromConditionalExpression(arg, scopeManager, namespace);
      case "UnaryExpression":
        arg = getParamFromUnaryExpression(arg, scopeManager, namespace);
        break;
      case "ArrayExpression":
        arg.elements = arg.elements.map((element) => {
          if (element.type === "Identifier") {
            if (scopeManager.isContextBound(element.name) && !scopeManager.isRootParam(element.name)) {
              return element;
            }
            const [scopedName, kind] = scopeManager.getVariable(element.name);
            return ASTFactory.createContextVariableAccess0(kind, scopedName);
          }
          return element;
        });
        break;
    }
    const isArrayAccess = arg.type === "MemberExpression" && arg.computed && arg.property;
    const isPropertyAccess = arg.type === "MemberExpression" && !arg.computed;
    if (isArrayAccess) {
      if (arg.object.type === "CallExpression") {
        transformCallExpression(arg.object, scopeManager);
      } else if (arg.object.type === "MemberExpression") {
        transformMemberExpression(arg.object, "", scopeManager);
      } else if (arg.object.type === "BinaryExpression") {
        arg.object = getParamFromBinaryExpression(arg.object, scopeManager, namespace);
      } else if (arg.object.type === "LogicalExpression") {
        arg.object = getParamFromLogicalExpression(arg.object, scopeManager, namespace);
      } else if (arg.object.type === "ConditionalExpression") {
        arg.object = getParamFromConditionalExpression(arg.object, scopeManager, namespace);
      } else if (arg.object.type === "UnaryExpression") {
        arg.object = getParamFromUnaryExpression(arg.object, scopeManager, namespace);
      }
      const transformedObject = arg.object.type === "Identifier" && scopeManager.isContextBound(arg.object.name) && !scopeManager.isRootParam(arg.object.name) ? arg.object : transformIdentifierForParam(arg.object, scopeManager);
      const transformedProperty = arg.property.type === "Identifier" && !scopeManager.isContextBound(arg.property.name) && !scopeManager.isLoopVariable(arg.property.name) ? transformIdentifierForParam(arg.property, scopeManager) : arg.property;
      const memberExpr2 = ASTFactory.createMemberExpression(ASTFactory.createIdentifier(namespace), ASTFactory.createIdentifier("param"));
      const nextParamId2 = scopeManager.generateParamId();
      const paramCall2 = {
        type: "CallExpression",
        callee: memberExpr2,
        arguments: [transformedObject, transformedProperty, { type: "Identifier", name: `'${nextParamId2}'` }],
        _transformed: true,
        _isParamCall: true
      };
      if (!scopeManager.shouldSuppressHoisting()) {
        const tempVarName = nextParamId2;
        scopeManager.addLocalSeriesVar(tempVarName);
        const variableDecl = ASTFactory.createVariableDeclaration(tempVarName, paramCall2);
        scopeManager.addHoistedStatement(variableDecl);
        return ASTFactory.createIdentifier(tempVarName);
      }
      return paramCall2;
    }
    if (isPropertyAccess) {
      if (arg.object.type === "Identifier") {
        const name = arg.object.name;
        const [varName, kind] = scopeManager.getVariable(name);
        const isRenamed = varName !== name;
        if (isRenamed && !scopeManager.isLoopVariable(name)) {
          const contextVarRef = ASTFactory.createContextVariableReference(kind, varName);
          const getCall = ASTFactory.createGetCall(contextVarRef, 0);
          arg.object = getCall;
        }
      } else if (arg.object.type === "MemberExpression") {
        transformFunctionArgument(arg.object, namespace, scopeManager);
      }
    }
    if (arg.type === "ObjectExpression") {
      arg.properties = arg.properties.map((prop) => {
        if (prop.value.name) {
          if (scopeManager.isContextBound(prop.value.name) && !scopeManager.isRootParam(prop.value.name)) {
            return {
              type: "Property",
              key: {
                type: "Identifier",
                name: prop.key.name
              },
              value: ASTFactory.createIdentifier(prop.value.name),
              kind: "init",
              method: false,
              shorthand: false,
              computed: false
            };
          }
          const [scopedName, kind] = scopeManager.getVariable(prop.value.name);
          return {
            type: "Property",
            key: {
              type: "Identifier",
              name: prop.key.name
            },
            value: ASTFactory.createContextVariableReference(kind, scopedName),
            kind: "init",
            method: false,
            shorthand: false,
            computed: false
          };
        } else if (prop.value.type !== "Literal") {
          prop.value = transformFunctionArgument(prop.value, namespace, scopeManager);
        }
        return prop;
      });
    }
    if (arg.type === "Identifier") {
      if (arg.name === "na") {
        arg.name = "NaN";
        return arg;
      }
      if (scopeManager.isContextBound(arg.name) && !scopeManager.isRootParam(arg.name)) {
        const memberExpr2 = ASTFactory.createMemberExpression(ASTFactory.createIdentifier(namespace), ASTFactory.createIdentifier("param"));
        const nextParamId2 = scopeManager.generateParamId();
        const paramCall2 = {
          type: "CallExpression",
          callee: memberExpr2,
          arguments: [arg, UNDEFINED_ARG, { type: "Identifier", name: `'${nextParamId2}'` }],
          _transformed: true,
          _isParamCall: true
        };
        if (!scopeManager.shouldSuppressHoisting()) {
          const tempVarName = nextParamId2;
          scopeManager.addLocalSeriesVar(tempVarName);
          const variableDecl = ASTFactory.createVariableDeclaration(tempVarName, paramCall2);
          scopeManager.addHoistedStatement(variableDecl);
          return ASTFactory.createIdentifier(tempVarName);
        }
        return paramCall2;
      }
    }
    if (arg?.type === "CallExpression") {
      transformCallExpression(arg, scopeManager);
    }
    const memberExpr = ASTFactory.createMemberExpression(ASTFactory.createIdentifier(namespace), ASTFactory.createIdentifier("param"));
    const transformedArg = arg.type === "Identifier" ? transformIdentifierForParam(arg, scopeManager) : arg;
    const nextParamId = scopeManager.generateParamId();
    const paramCall = {
      type: "CallExpression",
      callee: memberExpr,
      arguments: [transformedArg, UNDEFINED_ARG, { type: "Identifier", name: `'${nextParamId}'` }],
      _transformed: true,
      _isParamCall: true
    };
    if (!scopeManager.shouldSuppressHoisting()) {
      const tempVarName = nextParamId;
      scopeManager.addLocalSeriesVar(tempVarName);
      const variableDecl = ASTFactory.createVariableDeclaration(tempVarName, paramCall);
      scopeManager.addHoistedStatement(variableDecl);
      return ASTFactory.createIdentifier(tempVarName);
    }
    return paramCall;
  }
  function transformCallExpression(node, scopeManager, namespace) {
    if (node._transformed) {
      return;
    }
    if (node.callee && node.callee.type === "Identifier" && (KNOWN_NAMESPACES.includes(node.callee.name) || NAMESPACES_LIKE.includes(node.callee.name)) && scopeManager.isContextBound(node.callee.name)) {
      node.callee = ASTFactory.createMemberExpression(node.callee, ASTFactory.createIdentifier("any"));
    }
    const isNamespaceCall = node.callee && node.callee.type === "MemberExpression" && node.callee.object && node.callee.object.type === "Identifier" && (scopeManager.isContextBound(node.callee.object.name) || node.callee.object.name === "math" || node.callee.object.name === "ta");
    if (isNamespaceCall) {
      if (node.callee.object.name === CONTEXT_NAME && ["get", "init", "param"].includes(node.callee.property.name)) {
        return;
      }
      const namespace2 = node.callee.object.name;
      const newArgs = [];
      node.arguments.forEach((arg) => {
        if (arg._isParamCall) {
          newArgs.push(arg);
          return;
        }
        newArgs.push(transformFunctionArgument(arg, namespace2, scopeManager));
      });
      node.arguments = newArgs;
      if (namespace2 === "ta") {
        if (scopeManager.getCurrentScopeType() === "fn") {
          const staticId = scopeManager.getNextTACallId();
          const [scopedName, kind] = scopeManager.getVariable("_callId");
          let leftOperand;
          if (scopedName !== "_callId") {
            const contextVar = ASTFactory.createContextVariableReference(kind, scopedName);
            leftOperand = ASTFactory.createGetCall(contextVar, 0);
          } else {
            leftOperand = ASTFactory.createIdentifier("_callId");
          }
          const callIdArg = {
            type: "BinaryExpression",
            operator: "+",
            left: leftOperand,
            right: staticId
          };
          node.arguments.push(callIdArg);
        } else {
          node.arguments.push(scopeManager.getNextTACallId());
        }
      }
      const methodName = node.callee.property.name;
      const methodPath = `${namespace2}.${methodName}`;
      const isAsyncMethod = ASYNC_METHODS.includes(methodPath);
      const isAlreadyAwaited = node._insideAwait === true;
      if (isAsyncMethod && !isAlreadyAwaited) {
        const callExpressionCopy = Object.assign({}, node);
        const awaitExpr = ASTFactory.createAwaitExpression(callExpressionCopy);
        Object.assign(node, awaitExpr);
      }
      if (!scopeManager.shouldSuppressHoisting()) {
        const tempVarName = scopeManager.generateTempVar();
        scopeManager.addLocalSeriesVar(tempVarName);
        const wasInsideAwait = node._insideAwait === true;
        let initExpression = Object.assign({}, node);
        if (wasInsideAwait) {
          initExpression = ASTFactory.createAwaitExpression(initExpression);
        }
        const variableDecl = ASTFactory.createVariableDeclaration(tempVarName, initExpression);
        scopeManager.addHoistedStatement(variableDecl);
        const tempIdentifier = ASTFactory.createIdentifier(tempVarName);
        Object.assign(node, tempIdentifier);
        node._wasHoisted = true;
        node._wasInsideAwait = wasInsideAwait;
        return;
      }
      node._transformed = true;
    } else if (node.callee && node.callee.type === "Identifier") {
      node.arguments = node.arguments.map((arg) => {
        if (arg._isParamCall) {
          return arg;
        }
        return transformFunctionArgument(arg, CONTEXT_NAME, scopeManager);
      });
      if (!scopeManager.isContextBound(node.callee.name)) {
        const callId = scopeManager.getNextUserCallId();
        const contextCall = ASTFactory.createMemberExpression(ASTFactory.createContextIdentifier(), ASTFactory.createIdentifier("call"));
        const newArgs = [node.callee, callId, ...node.arguments];
        node.callee = contextCall;
        node.arguments = newArgs;
      }
      node._transformed = true;
    }
    if (!isNamespaceCall && node.callee && node.callee.type === "MemberExpression") {
      if (node.callee.object.type === "Identifier") {
        transformIdentifier(node.callee.object, scopeManager);
      }
    }
    node.arguments.forEach((arg) => {
      recursive(
        arg,
        { parent: node },
        {
          Identifier(node2, state, c) {
            node2.parent = state.parent;
            transformIdentifier(node2, scopeManager);
            const isBinaryOperation = node2.parent && node2.parent.type === "BinaryExpression";
            const isConditional = node2.parent && node2.parent.type === "ConditionalExpression";
            if (isConditional || isBinaryOperation) {
              if (node2.type === "MemberExpression") {
                transformArrayIndex(node2, scopeManager);
              } else if (node2.type === "Identifier") {
                const isGetCall = node2.parent && node2.parent.type === "CallExpression" && node2.parent.callee && node2.parent.callee.object && node2.parent.callee.object.name === CONTEXT_NAME && node2.parent.callee.property.name === "get";
                if (!isGetCall) {
                  addArrayAccess(node2);
                }
              }
            }
          },
          BinaryExpression(node2, state, c) {
            const newState = { ...state, parent: node2 };
            c(node2.left, newState);
            c(node2.right, newState);
          },
          LogicalExpression(node2, state, c) {
            const newState = { ...state, parent: node2 };
            c(node2.left, newState);
            c(node2.right, newState);
          },
          UnaryExpression(node2, state, c) {
            const newState = { ...state, parent: node2 };
            c(node2.argument, newState);
          },
          CallExpression(node2, state, c) {
            if (!node2._transformed) {
              transformCallExpression(node2, scopeManager);
            }
          },
          MemberExpression(node2, state, c) {
            transformMemberExpression(node2, "", scopeManager);
            if (node2.object) {
              c(node2.object, { parent: node2 });
            }
          }
        }
      );
    });
  }

  function transformAssignmentExpression(node, scopeManager) {
    let targetVarRef = null;
    if (node.left.type === "Identifier") {
      const [varName, kind] = scopeManager.getVariable(node.left.name);
      targetVarRef = ASTFactory.createContextVariableReference(kind, varName);
    } else if (node.left.type === "MemberExpression" && node.left.computed) {
      if (node.left.object.type === "Identifier") {
        const name = node.left.object.name;
        const [varName, kind] = scopeManager.getVariable(name);
        const isRenamed = varName !== name;
        const isContextBound = scopeManager.isContextBound(name);
        if ((isRenamed || isContextBound) && !scopeManager.isLoopVariable(name)) {
          if (node.left.property.type === "Literal" && node.left.property.value === 0) {
            targetVarRef = ASTFactory.createContextVariableReference(kind, varName);
          }
        }
      }
    } else if (node.left.type === "MemberExpression" && !node.left.computed) {
      if (node.left.object.type === "Identifier") {
        const name = node.left.object.name;
        const [varName, kind] = scopeManager.getVariable(name);
        const isRenamed = varName !== name;
        if (isRenamed && !scopeManager.isLoopVariable(name)) {
          const contextVarRef = ASTFactory.createContextVariableReference(kind, varName);
          const getCall = ASTFactory.createGetCall(contextVarRef, 0);
          node.left.object = getCall;
        }
      }
    }
    recursive(
      node.right,
      { parent: node.right, inNamespaceCall: false },
      {
        Identifier(node2, state, c) {
          if (node2.name == "na") {
            node2.name = "NaN";
          }
          node2.parent = state.parent;
          transformIdentifier(node2, scopeManager);
          const isBinaryOperation = node2.parent && node2.parent.type === "BinaryExpression";
          const isConditional = node2.parent && node2.parent.type === "ConditionalExpression";
          const isContextBound = scopeManager.isContextBound(node2.name) && !scopeManager.isRootParam(node2.name);
          const hasArrayAccess = node2.parent && node2.parent.type === "MemberExpression" && node2.parent.computed && node2.parent.object === node2;
          const isParamCall = node2.parent && node2.parent._isParamCall;
          const isMemberExpression = node2.parent && node2.parent.type === "MemberExpression";
          const isReserved = node2.name === "NaN";
          const isGetCall = node2.parent && node2.parent.type === "CallExpression" && node2.parent.callee && node2.parent.callee.object && node2.parent.callee.object.name === CONTEXT_NAME && node2.parent.callee.property.name === "get";
          if (isContextBound || isConditional || isBinaryOperation) {
            if (node2.type === "MemberExpression") {
              transformArrayIndex(node2, scopeManager);
            } else if (node2.type === "Identifier" && !isMemberExpression && !hasArrayAccess && !isParamCall && !isReserved && !isGetCall) {
              addArrayAccess(node2);
            }
          }
        },
        MemberExpression(node2, state, c) {
          transformMemberExpression(node2, "", scopeManager);
          if (node2.type === "CallExpression") {
            node2.arguments.forEach((arg) => c(arg, { parent: node2, inNamespaceCall: state.inNamespaceCall }));
          } else if (node2.object) {
            c(node2.object, { parent: node2, inNamespaceCall: state.inNamespaceCall });
          }
        },
        CallExpression(node2, state, c) {
          const isNamespaceCall = node2.callee && node2.callee.type === "MemberExpression" && node2.callee.object && node2.callee.object.type === "Identifier" && scopeManager.isContextBound(node2.callee.object.name);
          transformCallExpression(node2, scopeManager);
          if (node2.type !== "CallExpression") return;
          node2.arguments.forEach((arg) => c(arg, { parent: node2, inNamespaceCall: isNamespaceCall || state.inNamespaceCall }));
        }
      }
    );
    if (targetVarRef) {
      let rightSide = node.right;
      if (node.operator !== "=") {
        const operator = node.operator.replace("=", "");
        const readAccess = ASTFactory.createGetCall(targetVarRef, 0);
        rightSide = {
          type: "BinaryExpression",
          operator,
          left: readAccess,
          right: node.right,
          start: node.start,
          end: node.end
        };
      }
      const setCall = ASTFactory.createSetCall(targetVarRef, rightSide);
      if (node.start) setCall.start = node.start;
      if (node.end) setCall.end = node.end;
      Object.assign(node, setCall);
    }
  }
  function transformVariableDeclaration(varNode, scopeManager) {
    varNode.declarations.forEach((decl) => {
      if (decl.init.name == "na") {
        decl.init.name = "NaN";
      }
      const isContextProperty = decl.init && decl.init.type === "MemberExpression" && decl.init.object && (decl.init.object.name === "context" || decl.init.object.name === CONTEXT_NAME || decl.init.object.name === "context2");
      const isSubContextProperty = decl.init && decl.init.type === "MemberExpression" && decl.init.object?.object && (decl.init.object.object.name === "context" || decl.init.object.object.name === CONTEXT_NAME || decl.init.object.object.name === "context2");
      const isArrowFunction = decl.init && decl.init.type === "ArrowFunctionExpression";
      if (isContextProperty) {
        if (decl.id.name) {
          scopeManager.addContextBoundVar(decl.id.name);
        }
        if (decl.id.properties) {
          decl.id.properties.forEach((property) => {
            if (property.key.name) {
              scopeManager.addContextBoundVar(property.key.name);
            }
          });
        }
        decl.init.object.name = CONTEXT_NAME;
        return;
      }
      if (isSubContextProperty) {
        if (decl.id.name) {
          scopeManager.addContextBoundVar(decl.id.name);
        }
        if (decl.id.properties) {
          decl.id.properties.forEach((property) => {
            if (property.key.name) {
              scopeManager.addContextBoundVar(property.key.name);
            }
          });
        }
        decl.init.object.object.name = CONTEXT_NAME;
        return;
      }
      if (isArrowFunction) {
        decl.init.params.forEach((param) => {
          if (param.type === "Identifier") {
            scopeManager.addContextBoundVar(param.name);
          }
        });
      }
      const newName = scopeManager.addVariable(decl.id.name, varNode.kind);
      const kind = varNode.kind;
      const isArrayPatternVar = scopeManager.isArrayPatternElement(decl.id.name);
      if (decl.init && !isArrowFunction && !isArrayPatternVar) {
        if (decl.init.type === "CallExpression" && decl.init.callee.type === "MemberExpression" && decl.init.callee.object && decl.init.callee.object.type === "Identifier" && scopeManager.isContextBound(decl.init.callee.object.name)) {
          transformCallExpression(decl.init, scopeManager);
        } else {
          recursive(
            decl.init,
            { parent: decl.init },
            {
              Identifier(node, state) {
                node.parent = state.parent;
                transformIdentifier(node, scopeManager);
                const isBinaryOperation = node.parent && node.parent.type === "BinaryExpression";
                const isUnaryOperation = node.parent && node.parent.type === "UnaryExpression";
                const isConditional = node.parent && node.parent.type === "ConditionalExpression";
                const isGetCall = node.parent && node.parent.type === "CallExpression" && node.parent.callee && node.parent.callee.object && node.parent.callee.object.name === CONTEXT_NAME && node.parent.callee.property.name === "get";
                if (node.type === "Identifier" && (isBinaryOperation || isUnaryOperation || isConditional) && !isGetCall) {
                  addArrayAccess(node);
                }
              },
              CallExpression(node, state, c) {
                if (node.callee.type === "Identifier") {
                  node.callee.parent = node;
                }
                node.arguments.forEach((arg) => {
                  if (arg.type === "Identifier") {
                    arg.parent = node;
                  }
                });
                transformCallExpression(node, scopeManager);
                if (node.type !== "CallExpression") return;
                node.arguments.forEach((arg) => c(arg, { parent: node }));
              },
              BinaryExpression(node, state, c) {
                if (node.left.type === "Identifier") {
                  node.left.parent = node;
                }
                if (node.right.type === "Identifier") {
                  node.right.parent = node;
                }
                c(node.left, { parent: node });
                c(node.right, { parent: node });
              },
              MemberExpression(node, state, c) {
                if (node.object && node.object.type === "Identifier") {
                  node.object.parent = node;
                }
                if (node.property && node.property.type === "Identifier") {
                  node.property.parent = node;
                }
                transformMemberExpression(node, "", scopeManager);
                if (node.type === "CallExpression") {
                  node.arguments.forEach((arg) => c(arg, { parent: node }));
                } else if (node.object) {
                  c(node.object, { parent: node });
                }
              },
              AwaitExpression(node, state, c) {
                if (node.argument) {
                  node.argument._insideAwait = true;
                  c(node.argument, { parent: node });
                  if (node.argument.type === "Identifier" && node.argument._wasInsideAwait) {
                    Object.assign(node, node.argument);
                  }
                }
              }
            }
          );
        }
      }
      const targetVarRef = ASTFactory.createContextVariableReference(kind, newName);
      const isArrayInit = !isArrayPatternVar && decl.init && decl.init.type === "MemberExpression" && decl.init.computed && decl.init.property && (decl.init.property.type === "Literal" || decl.init.property.type === "MemberExpression");
      if (decl.init?.property?.type === "MemberExpression") {
        if (!decl.init.property._indexTransformed) {
          transformArrayIndex(decl.init.property, scopeManager);
          decl.init.property._indexTransformed = true;
        }
      }
      let rightSide;
      if (decl.init) {
        if (isArrowFunction || isArrayPatternVar) {
          rightSide = decl.init;
        } else if (kind === "var") {
          rightSide = ASTFactory.createInitVarCall(targetVarRef, decl.init);
        } else {
          rightSide = ASTFactory.createInitCall(
            targetVarRef,
            isArrayInit ? decl.init.object : decl.init,
            isArrayInit ? decl.init.property : void 0
          );
        }
      } else {
        rightSide = ASTFactory.createIdentifier("undefined");
      }
      const assignmentExpr = ASTFactory.createExpressionStatement(ASTFactory.createAssignmentExpression(targetVarRef, rightSide));
      if (isArrayPatternVar) {
        const tempVarName = decl.init.object.name;
        const [scopedTempName, tempKind] = scopeManager.getVariable(tempVarName);
        const tempVarRef = ASTFactory.createContextVariableReference(tempKind, scopedTempName);
        const arrayIndex = decl.init.property.value;
        const getCall = ASTFactory.createGetCall(tempVarRef, 0);
        const arrayAccess = {
          type: "MemberExpression",
          object: getCall,
          property: {
            type: "Literal",
            value: arrayIndex
          },
          computed: true
        };
        assignmentExpr.expression.right = ASTFactory.createCallExpression(
          ASTFactory.createMemberExpression(ASTFactory.createContextIdentifier(), ASTFactory.createIdentifier("init")),
          [targetVarRef, arrayAccess]
        );
      }
      if (isArrowFunction) {
        scopeManager.pushScope("fn");
        recursive(decl.init.body, scopeManager, {
          BlockStatement(node, state, c) {
            node.body.forEach((stmt) => c(stmt, state));
          },
          IfStatement(node, state, c) {
            state.pushScope("if");
            c(node.consequent, state);
            if (node.alternate) {
              state.pushScope("els");
              c(node.alternate, state);
              state.popScope();
            }
            state.popScope();
          },
          VariableDeclaration(node, state) {
            transformVariableDeclaration(node, state);
          },
          Identifier(node, state) {
            transformIdentifier(node, state);
          },
          AssignmentExpression(node, state) {
            transformAssignmentExpression(node, state);
          }
        });
        scopeManager.popScope();
      }
      Object.assign(varNode, assignmentExpr);
    });
  }
  function transformForStatement(node, scopeManager, c) {
    scopeManager.setSuppressHoisting(true);
    if (node.init && node.init.type === "VariableDeclaration") {
      const decl = node.init.declarations[0];
      const originalName = decl.id.name;
      scopeManager.addLoopVariable(originalName, originalName);
      node.init = {
        type: "VariableDeclaration",
        kind: node.init.kind,
        declarations: [
          {
            type: "VariableDeclarator",
            id: {
              type: "Identifier",
              name: originalName
            },
            init: decl.init
          }
        ]
      };
      if (decl.init) {
        recursive(decl.init, scopeManager, {
          Identifier(node2, state) {
            if (!scopeManager.isLoopVariable(node2.name)) {
              scopeManager.pushScope("for");
              transformIdentifier(node2, state);
              scopeManager.popScope();
            }
          },
          MemberExpression(node2) {
            scopeManager.pushScope("for");
            transformMemberExpression(node2, "", scopeManager);
            scopeManager.popScope();
          }
        });
      }
    }
    if (node.test) {
      recursive(node.test, scopeManager, {
        Identifier(node2, state) {
          if (!scopeManager.isLoopVariable(node2.name) && !node2.computed) {
            scopeManager.pushScope("for");
            transformIdentifier(node2, state);
            if (node2.type === "Identifier") {
              node2.computed = true;
              addArrayAccess(node2);
            }
            scopeManager.popScope();
          }
        },
        MemberExpression(node2) {
          scopeManager.pushScope("for");
          transformMemberExpression(node2, "", scopeManager);
          scopeManager.popScope();
        }
      });
    }
    if (node.update) {
      recursive(node.update, scopeManager, {
        Identifier(node2, state) {
          if (!scopeManager.isLoopVariable(node2.name)) {
            scopeManager.pushScope("for");
            transformIdentifier(node2, state);
            scopeManager.popScope();
          }
        }
      });
    }
    scopeManager.setSuppressHoisting(false);
    scopeManager.pushScope("for");
    c(node.body, scopeManager);
    scopeManager.popScope();
  }
  function transformExpression(node, scopeManager) {
    recursive(node, scopeManager, {
      MemberExpression(node2) {
        transformMemberExpression(node2, "", scopeManager);
      },
      CallExpression(node2, state) {
        transformCallExpression(node2, state);
      },
      Identifier(node2, state) {
        transformIdentifier(node2, state);
        const isIfStatement = scopeManager.getCurrentScopeType() === "if";
        const isContextBound = scopeManager.isContextBound(node2.name) && !scopeManager.isRootParam(node2.name);
        if (isContextBound && isIfStatement) {
          addArrayAccess(node2);
        }
      }
    });
  }
  function transformIfStatement(node, scopeManager, c) {
    if (node.test) {
      scopeManager.pushScope("if");
      transformExpression(node.test, scopeManager);
      scopeManager.popScope();
    }
    scopeManager.pushScope("if");
    c(node.consequent, scopeManager);
    scopeManager.popScope();
    if (node.alternate) {
      scopeManager.pushScope("els");
      c(node.alternate, scopeManager);
      scopeManager.popScope();
    }
  }
  function transformReturnStatement(node, scopeManager) {
    const curScope = scopeManager.getCurrentScopeType();
    if (node.argument) {
      if (node.argument.type === "ArrayExpression") {
        node.argument.elements = node.argument.elements.map((element) => {
          if (element.type === "Identifier") {
            if (scopeManager.isContextBound(element.name) && !scopeManager.isRootParam(element.name)) {
              return ASTFactory.createGetCall(element, 0);
            }
            const [scopedName, kind] = scopeManager.getVariable(element.name);
            return ASTFactory.createContextVariableAccess0(kind, scopedName);
          } else if (element.type === "MemberExpression") {
            const isContextVarRef = element.object && element.object.type === "MemberExpression" && element.object.object && element.object.object.type === "Identifier" && element.object.object.name === "$" && element.object.property && ["const", "let", "var", "params"].includes(element.object.property.name);
            if (isContextVarRef) {
              return ASTFactory.createGetCall(element, 0);
            }
            if (element.computed && element.object.type === "Identifier" && scopeManager.isContextBound(element.object.name) && !scopeManager.isRootParam(element.object.name)) {
              return element;
            }
            transformMemberExpression(element, "", scopeManager);
            return element;
          }
          return element;
        });
        node.argument = {
          type: "ArrayExpression",
          elements: [node.argument]
        };
      } else if (node.argument.type === "ObjectExpression") {
        node.argument.properties = node.argument.properties.map((prop) => {
          if (prop.shorthand) {
            if (scopeManager.isContextBound(prop.value.name)) {
              return prop;
            }
            const [scopedName, kind] = scopeManager.getVariable(prop.value.name);
            return {
              type: "Property",
              key: ASTFactory.createIdentifier(prop.key.name),
              value: ASTFactory.createContextVariableReference(kind, scopedName),
              kind: "init",
              method: false,
              shorthand: false,
              computed: false
            };
          }
          if (prop.value && prop.value.type === "Identifier") {
            if (scopeManager.isContextBound(prop.value.name) && !scopeManager.isRootParam(prop.value.name)) ; else if (!scopeManager.isContextBound(prop.value.name)) {
              const [scopedName, kind] = scopeManager.getVariable(prop.value.name);
              prop.value = ASTFactory.createContextVariableReference(kind, scopedName);
            }
          }
          return prop;
        });
      } else if (node.argument.type === "Identifier") {
        transformIdentifier(node.argument, scopeManager);
        if (node.argument.type === "Identifier") {
          addArrayAccess(node.argument);
        }
      }
      if (curScope === "fn") {
        if (node.argument.type === "Identifier" && scopeManager.isContextBound(node.argument.name) && !scopeManager.isRootParam(node.argument.name)) {
          node.argument = ASTFactory.createArrayAccess(node.argument, 0);
        } else if (node.argument.type === "MemberExpression") {
          if (node.argument.object.type === "Identifier" && scopeManager.isContextBound(node.argument.object.name) && !scopeManager.isRootParam(node.argument.object.name)) {
            if (!node.argument._indexTransformed) {
              transformArrayIndex(node.argument, scopeManager);
              node.argument._indexTransformed = true;
            }
          }
        } else if (node.argument.type === "BinaryExpression" || node.argument.type === "LogicalExpression" || node.argument.type === "ConditionalExpression" || node.argument.type === "CallExpression") {
          recursive(node.argument, scopeManager, {
            Identifier(node2, state) {
              transformIdentifier(node2, state);
              if (node2.type === "Identifier" && !node2._arrayAccessed) {
                addArrayAccess(node2);
                node2._arrayAccessed = true;
              }
            },
            MemberExpression(node2) {
              transformMemberExpression(node2, "", scopeManager);
            },
            // c is the callback function for recursion (acorn-walk)
            CallExpression(node2, state, c) {
              transformCallExpression(node2, state);
              if (node2.type === "CallExpression") {
                node2.arguments.forEach((arg) => c(arg, state));
              }
            },
            BinaryExpression(node2, state, c) {
              c(node2.left, state);
              c(node2.right, state);
            }
          });
        }
        const precisionCall = ASTFactory.createCallExpression(
          ASTFactory.createMemberExpression(ASTFactory.createContextIdentifier(), ASTFactory.createIdentifier("precision")),
          [node.argument]
        );
        node.argument = precisionCall;
      }
    }
  }
  function transformFunctionDeclaration(node, scopeManager, c) {
    const callIdDecl = ASTFactory.createVariableDeclaration(
      "_callId",
      ASTFactory.createCallExpression(
        ASTFactory.createMemberExpression(ASTFactory.createContextIdentifier(), ASTFactory.createIdentifier("peekId")),
        []
      )
    );
    if (node.body && node.body.type === "BlockStatement") {
      node.body.body.unshift(callIdDecl);
      scopeManager.pushScope("fn");
      c(node.body, scopeManager);
      scopeManager.popScope();
    }
  }

  function transformEqualityChecks(ast) {
    const baseVisitor = { ...base, LineComment: () => {
    } };
    simple(
      ast,
      {
        BinaryExpression(node) {
          if (node.operator === "==" || node.operator === "===") {
            const leftOperand = node.left;
            const rightOperand = node.right;
            const callExpr = ASTFactory.createMathEqCall(leftOperand, rightOperand);
            callExpr._transformed = true;
            Object.assign(node, callExpr);
          }
        }
      },
      baseVisitor
    );
  }
  function runTransformationPass(ast, scopeManager, originalParamName, options = { debug: false, ln: false }, sourceLines = []) {
    const createDebugComment = (originalNode) => {
      if (!options.debug || !originalNode.loc || !sourceLines.length) return null;
      const lineIndex = originalNode.loc.start.line - 1;
      if (lineIndex >= 0 && lineIndex < sourceLines.length) {
        const lineText = sourceLines[lineIndex].trim();
        if (lineText) {
          const prefix = options.ln ? ` [Line ${originalNode.loc.start.line}]` : "";
          return {
            type: "LineComment",
            value: `${prefix} ${lineText}`
          };
        }
      }
      return null;
    };
    recursive(ast, scopeManager, {
      Program(node, state, c) {
        const newBody = [];
        node.body.forEach((stmt) => {
          state.enterHoistingScope();
          c(stmt, state);
          const hoistedStmts = state.exitHoistingScope();
          const commentNode = createDebugComment(stmt);
          if (commentNode) newBody.push(commentNode);
          newBody.push(...hoistedStmts);
          newBody.push(stmt);
        });
        node.body = newBody;
      },
      BlockStatement(node, state, c) {
        const newBody = [];
        node.body.forEach((stmt) => {
          state.enterHoistingScope();
          c(stmt, state);
          const hoistedStmts = state.exitHoistingScope();
          const commentNode = createDebugComment(stmt);
          if (commentNode) newBody.push(commentNode);
          newBody.push(...hoistedStmts);
          newBody.push(stmt);
        });
        node.body = newBody;
      },
      ReturnStatement(node, state) {
        transformReturnStatement(node, state);
      },
      VariableDeclaration(node, state) {
        transformVariableDeclaration(node, state);
      },
      Identifier(node, state) {
        transformIdentifier(node, state);
      },
      CallExpression(node, state) {
        transformCallExpression(node, state);
      },
      MemberExpression(node, state) {
        transformMemberExpression(node, originalParamName, state);
      },
      AssignmentExpression(node, state) {
        transformAssignmentExpression(node, state);
      },
      FunctionDeclaration(node, state, c) {
        transformFunctionDeclaration(node, state, c);
      },
      ForStatement(node, state, c) {
        transformForStatement(node, state, c);
      },
      IfStatement(node, state, c) {
        transformIfStatement(node, state, c);
      },
      AwaitExpression(node, state, c) {
        if (node.argument) {
          node.argument._insideAwait = true;
          c(node.argument, state);
          if (node.argument.type === "Identifier") {
            const isHoistedAwaitedCall = node.argument._wasInsideAwait === true;
            if (isHoistedAwaitedCall) {
              node.type = "Identifier";
              node.name = node.argument.name;
              if (node.argument._wasHoisted) node._wasHoisted = node.argument._wasHoisted;
              delete node.argument;
            }
          }
        }
      }
    });
  }

  const TokenType = {
    // Literals
    NUMBER: "NUMBER",
    STRING: "STRING",
    BOOLEAN: "BOOLEAN",
    // Identifiers and keywords
    IDENTIFIER: "IDENTIFIER",
    KEYWORD: "KEYWORD",
    // Operators
    OPERATOR: "OPERATOR",
    // Punctuation
    LPAREN: "LPAREN",
    // (
    RPAREN: "RPAREN",
    // )
    LBRACKET: "LBRACKET",
    // [
    RBRACKET: "RBRACKET",
    // ]
    LBRACE: "LBRACE",
    // {
    RBRACE: "RBRACE",
    // }
    COMMA: "COMMA",
    // ,
    DOT: "DOT",
    // .
    COLON: "COLON",
    // :
    SEMICOLON: "SEMICOLON",
    // ;
    // Indentation (critical for PineScript!)
    INDENT: "INDENT",
    DEDENT: "DEDENT",
    NEWLINE: "NEWLINE",
    // Special
    COMMENT: "COMMENT",
    EOF: "EOF"
  };
  const Keywords = /* @__PURE__ */ new Set([
    // Control flow
    "if",
    "else",
    "for",
    "while",
    "switch",
    "break",
    "continue",
    // Declarations
    "var",
    "varip",
    "type",
    // Logical operators
    "and",
    "or",
    "not",
    // Other
    "to",
    "by",
    "in",
    "import",
    "export",
    "method",
    "extends"
  ]);
  const MultiCharOperators = ["==", "!=", "<=", ">=", ":=", "+=", "-=", "*=", "/=", "%=", "=>", "//", "and", "or", "not"];
  class Token {
    constructor(type, value, line, column, indent = 0) {
      this.type = type;
      this.value = value;
      this.line = line;
      this.column = column;
      this.indent = indent;
    }
    // toString() {
    //     return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.column}, indent=${this.indent})`;
    // }
  }

  var __defProp$x = Object.defineProperty;
  var __defNormalProp$x = (obj, key, value) => key in obj ? __defProp$x(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$x = (obj, key, value) => __defNormalProp$x(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Lexer {
    constructor(source) {
      __publicField$x(this, "source");
      __publicField$x(this, "pos");
      __publicField$x(this, "line");
      __publicField$x(this, "column");
      __publicField$x(this, "tokens");
      __publicField$x(this, "indentStack");
      __publicField$x(this, "atLineStart");
      __publicField$x(this, "parenDepth");
      __publicField$x(this, "bracketDepth");
      __publicField$x(this, "braceDepth");
      this.source = source;
      this.pos = 0;
      this.line = 1;
      this.column = 1;
      this.tokens = [];
      this.indentStack = [0];
      this.atLineStart = true;
      this.parenDepth = 0;
      this.bracketDepth = 0;
      this.braceDepth = 0;
    }
    // Main tokenize method
    tokenize() {
      while (this.pos < this.source.length) {
        const ch = this.peek();
        if (ch === "\r") {
          this.advance();
          continue;
        }
        if (ch === "\n") {
          this.handleNewline();
          continue;
        }
        if (this.atLineStart && ch !== "\n") {
          this.handleIndentation();
          this.atLineStart = false;
          continue;
        }
        if (ch === " " || ch === "	") {
          this.advance();
          continue;
        }
        if (this.pos >= this.source.length) break;
        if (ch === "/" && this.peek(1) === "/") {
          this.readComment();
          continue;
        }
        if (ch === '"' || ch === "'") {
          this.readString();
          continue;
        }
        if (ch === "#") {
          this.readColorLiteral();
          continue;
        }
        if (this.isDigit(ch)) {
          this.readNumber();
          continue;
        }
        if (this.isIdentifierStart(ch)) {
          this.readIdentifier();
          continue;
        }
        if (this.readOperatorOrPunctuation()) {
          continue;
        }
        throw new Error(`Unexpected character '${ch}' at ${this.line}:${this.column}`);
      }
      while (this.indentStack.length > 1) {
        this.indentStack.pop();
        this.addToken(TokenType.DEDENT, "", this.getCurrentIndent());
      }
      this.addToken(TokenType.EOF, "");
      return this.tokens;
    }
    // Handle newline and emit NEWLINE token
    handleNewline() {
      if (this.parenDepth === 0 && this.bracketDepth === 0 && this.braceDepth === 0) {
        this.addToken(TokenType.NEWLINE, "\n");
        this.atLineStart = true;
      }
      this.advance();
      this.line++;
      this.column = 1;
    }
    // Handle indentation at start of line
    handleIndentation() {
      let indent = 0;
      let spaceCount = 0;
      this.pos;
      while (this.pos < this.source.length) {
        const ch = this.peek();
        if (ch === " ") {
          spaceCount++;
          this.advance();
        } else if (ch === "	") {
          indent++;
          this.advance();
        } else {
          break;
        }
      }
      if (this.peek() === "\n" || this.peek() === "\0") {
        return;
      }
      indent += Math.floor(spaceCount / 4);
      const currentIndent = this.indentStack[this.indentStack.length - 1];
      if (indent > currentIndent) {
        this.indentStack.push(indent);
        this.addToken(TokenType.INDENT, "", indent);
      } else if (indent < currentIndent) {
        while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > indent) {
          this.indentStack.pop();
          this.addToken(TokenType.DEDENT, "", this.indentStack[this.indentStack.length - 1]);
        }
        if (this.indentStack[this.indentStack.length - 1] !== indent) {
          throw new Error(`Indentation error at ${this.line}:${this.column} - misaligned dedent`);
        }
      }
    }
    // Read comment
    readComment() {
      this.column;
      let comment = "";
      this.advance();
      this.advance();
      while (this.pos < this.source.length && this.peek() !== "\n") {
        comment += this.advance();
      }
      this.addToken(TokenType.COMMENT, comment.trim());
    }
    // Read string literal
    readString() {
      const quote = this.advance();
      const startCol = this.column - 1;
      let value = "";
      while (this.pos < this.source.length && this.peek() !== quote) {
        if (this.peek() === "\\") {
          this.advance();
          const escaped = this.advance();
          switch (escaped) {
            case "n":
              value += "\n";
              break;
            case "t":
              value += "	";
              break;
            case "r":
              value += "\r";
              break;
            case "\\":
              value += "\\";
              break;
            case quote:
              value += quote;
              break;
            default:
              value += escaped;
          }
        } else {
          value += this.advance();
        }
      }
      if (this.peek() !== quote) {
        throw new Error(`Unterminated string at ${this.line}:${startCol}`);
      }
      this.advance();
      this.addToken(TokenType.STRING, value);
    }
    // Read color literal (#RRGGBB or #RRGGBBAA)
    readColorLiteral() {
      const startCol = this.column;
      let value = "#";
      this.advance();
      while (this.pos < this.source.length && value.length < 9) {
        const ch = this.peek();
        if (ch >= "0" && ch <= "9" || ch >= "A" && ch <= "F" || ch >= "a" && ch <= "f") {
          value += this.advance();
        } else {
          break;
        }
      }
      if (value.length !== 7 && value.length !== 9) {
        throw new Error(`Invalid color literal '${value}' at ${this.line}:${startCol}`);
      }
      this.addToken(TokenType.STRING, value);
    }
    // Read number literal
    readNumber() {
      this.column;
      let value = "";
      let hasDecimal = false;
      while (this.pos < this.source.length) {
        const ch = this.peek();
        if (this.isDigit(ch)) {
          value += this.advance();
        } else if (ch === "." && !hasDecimal) {
          const nextCh = this.peek(1);
          if (this.isDigit(nextCh) || !this.isIdentifierStart(nextCh)) {
            hasDecimal = true;
            value += this.advance();
            if (!this.isDigit(this.peek())) {
              break;
            }
          } else {
            break;
          }
        } else {
          break;
        }
      }
      if (this.pos < this.source.length) {
        const ch = this.peek();
        if (ch === "e" || ch === "E") {
          const nextCh = this.peek(1);
          if (this.isDigit(nextCh)) {
            value += this.advance();
            while (this.pos < this.source.length && this.isDigit(this.peek())) {
              value += this.advance();
            }
          } else if (nextCh === "+" || nextCh === "-") {
            const nextNextCh = this.peek(2);
            if (this.isDigit(nextNextCh)) {
              value += this.advance();
              value += this.advance();
              while (this.pos < this.source.length && this.isDigit(this.peek())) {
                value += this.advance();
              }
            }
          }
        }
      }
      this.addToken(TokenType.NUMBER, parseFloat(value));
    }
    // Read identifier or keyword
    readIdentifier() {
      this.column;
      let value = "";
      while (this.pos < this.source.length && this.isIdentifierChar(this.peek())) {
        value += this.advance();
      }
      if (Keywords.has(value)) {
        this.addToken(TokenType.KEYWORD, value);
      } else if (value === "true" || value === "false") {
        this.addToken(TokenType.BOOLEAN, value === "true");
      } else {
        this.addToken(TokenType.IDENTIFIER, value);
      }
    }
    // Read operator or punctuation
    readOperatorOrPunctuation() {
      const ch = this.peek();
      const next = this.peek(1);
      const twoChar = ch + next;
      if (MultiCharOperators.includes(twoChar)) {
        this.advance();
        this.advance();
        this.addToken(TokenType.OPERATOR, twoChar);
        return true;
      }
      if ("+-*/%<>=!?".includes(ch)) {
        this.advance();
        this.addToken(TokenType.OPERATOR, ch);
        return true;
      }
      switch (ch) {
        case "(":
          this.parenDepth++;
          this.advance();
          this.addToken(TokenType.LPAREN, ch);
          return true;
        case ")":
          this.parenDepth--;
          this.advance();
          this.addToken(TokenType.RPAREN, ch);
          return true;
        case "[":
          this.bracketDepth++;
          this.advance();
          this.addToken(TokenType.LBRACKET, ch);
          return true;
        case "]":
          this.bracketDepth--;
          this.advance();
          this.addToken(TokenType.RBRACKET, ch);
          return true;
        case "{":
          this.braceDepth++;
          this.advance();
          this.addToken(TokenType.LBRACE, ch);
          return true;
        case "}":
          this.braceDepth--;
          this.advance();
          this.addToken(TokenType.RBRACE, ch);
          return true;
        case ",":
          this.advance();
          this.addToken(TokenType.COMMA, ch);
          return true;
        case ".":
          this.advance();
          this.addToken(TokenType.DOT, ch);
          return true;
        case ":":
          this.advance();
          this.addToken(TokenType.COLON, ch);
          return true;
        case ";":
          this.advance();
          this.addToken(TokenType.SEMICOLON, ch);
          return true;
      }
      return false;
    }
    // Helper methods
    peek(offset = 0) {
      const pos = this.pos + offset;
      return pos < this.source.length ? this.source[pos] : "\0";
    }
    advance() {
      const ch = this.source[this.pos++];
      this.column++;
      return ch;
    }
    skipWhitespaceInline() {
      if (this.atLineStart) return;
      while (this.pos < this.source.length && (this.peek() === " " || this.peek() === "	")) {
        this.advance();
      }
    }
    isDigit(ch) {
      return ch >= "0" && ch <= "9";
    }
    isIdentifierStart(ch) {
      return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch === "_";
    }
    isIdentifierChar(ch) {
      return this.isIdentifierStart(ch) || this.isDigit(ch);
    }
    getCurrentIndent() {
      return this.indentStack[this.indentStack.length - 1];
    }
    addToken(type, value, indent = null) {
      const token = new Token(type, value, this.line, this.column, indent !== null ? indent : this.getCurrentIndent());
      this.tokens.push(token);
    }
  }

  var __defProp$w = Object.defineProperty;
  var __defNormalProp$w = (obj, key, value) => key in obj ? __defProp$w(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$w = (obj, key, value) => __defNormalProp$w(obj, typeof key !== "symbol" ? key + "" : key, value);
  class ASTNode {
    constructor(type) {
      this.type = type;
    }
  }
  class Program extends ASTNode {
    constructor(body) {
      super("Program");
      this.body = body;
    }
  }
  class ExpressionStatement extends ASTNode {
    constructor(expression) {
      super("ExpressionStatement");
      this.expression = expression;
    }
  }
  var VariableDeclarationKind = /* @__PURE__ */ ((VariableDeclarationKind2) => {
    VariableDeclarationKind2["VAR"] = "var";
    VariableDeclarationKind2["LET"] = "let";
    VariableDeclarationKind2["CONST"] = "const";
    return VariableDeclarationKind2;
  })(VariableDeclarationKind || {});
  class VariableDeclaration extends ASTNode {
    constructor(declarations, kind = "let" /* LET */) {
      super("VariableDeclaration");
      this.declarations = declarations;
      this.kind = kind;
    }
  }
  class VariableDeclarator extends ASTNode {
    constructor(id, init, varType = null) {
      super("VariableDeclarator");
      this.id = id;
      this.init = init;
      this.varType = varType;
    }
  }
  class FunctionDeclaration extends ASTNode {
    constructor(id, params, body, returnType = null) {
      super("FunctionDeclaration");
      this.id = id;
      this.params = params;
      this.body = body;
      this.returnType = returnType;
    }
  }
  class TypeDefinition extends ASTNode {
    constructor(name, fields) {
      super("TypeDefinition");
      this.name = name;
      this.fields = fields;
    }
  }
  class IfStatement extends ASTNode {
    constructor(test, consequent, alternate = null) {
      super("IfStatement");
      this.test = test;
      this.consequent = consequent;
      this.alternate = alternate;
      __publicField$w(this, "_line");
    }
  }
  class ForStatement extends ASTNode {
    constructor(init, test, update, body) {
      super("ForStatement");
      this.init = init;
      this.test = test;
      this.update = update;
      this.body = body;
      __publicField$w(this, "isForIn");
    }
  }
  class WhileStatement extends ASTNode {
    constructor(test, body) {
      super("WhileStatement");
      this.test = test;
      this.body = body;
    }
  }
  class BlockStatement extends ASTNode {
    constructor(body) {
      super("BlockStatement");
      this.body = body;
    }
  }
  class ReturnStatement extends ASTNode {
    constructor(argument) {
      super("ReturnStatement");
      this.argument = argument;
    }
  }
  class Identifier extends ASTNode {
    constructor(name) {
      super("Identifier");
      this.name = name;
      __publicField$w(this, "varType");
      __publicField$w(this, "returnType");
      __publicField$w(this, "isMethod");
    }
  }
  class Literal extends ASTNode {
    constructor(value, raw = null) {
      super("Literal");
      this.value = value;
      this.raw = raw;
    }
  }
  class BinaryExpression extends ASTNode {
    constructor(operator, left, right) {
      super("BinaryExpression");
      this.operator = operator;
      this.left = left;
      this.right = right;
    }
  }
  class UnaryExpression extends ASTNode {
    constructor(operator, argument, prefix = true) {
      super("UnaryExpression");
      this.operator = operator;
      this.argument = argument;
      this.prefix = prefix;
    }
  }
  class AssignmentExpression extends ASTNode {
    constructor(operator, left, right) {
      super("AssignmentExpression");
      this.operator = operator;
      this.left = left;
      this.right = right;
    }
  }
  class UpdateExpression extends ASTNode {
    constructor(operator, argument, prefix = false) {
      super("UpdateExpression");
      this.operator = operator;
      this.argument = argument;
      this.prefix = prefix;
    }
  }
  class CallExpression extends ASTNode {
    constructor(callee, args) {
      super("CallExpression");
      this.callee = callee;
      this.args = args;
      __publicField$w(this, "arguments");
      this.callee = callee;
      this.arguments = args;
    }
  }
  class MemberExpression extends ASTNode {
    constructor(object, property, computed = false) {
      super("MemberExpression");
      this.object = object;
      this.property = property;
      this.computed = computed;
    }
  }
  class ConditionalExpression extends ASTNode {
    constructor(test, consequent, alternate) {
      super("ConditionalExpression");
      this.test = test;
      this.consequent = consequent;
      this.alternate = alternate;
      __publicField$w(this, "needsIIFE");
      __publicField$w(this, "consequentStmts");
      __publicField$w(this, "alternateStmts");
    }
  }
  class ArrayExpression extends ASTNode {
    constructor(elements) {
      super("ArrayExpression");
      this.elements = elements;
    }
  }
  class ObjectExpression extends ASTNode {
    constructor(properties) {
      super("ObjectExpression");
      this.properties = properties;
    }
  }
  class Property extends ASTNode {
    constructor(key, value) {
      super("Property");
      this.key = key;
      this.value = value;
      __publicField$w(this, "kind");
      __publicField$w(this, "method");
      __publicField$w(this, "shorthand");
      __publicField$w(this, "computed");
      this.kind = "init";
      this.method = false;
      this.shorthand = false;
      this.computed = false;
    }
  }
  class ArrayPattern extends ASTNode {
    constructor(elements) {
      super("ArrayPattern");
      this.elements = elements;
    }
  }
  class AssignmentPattern extends ASTNode {
    constructor(left, right) {
      super("AssignmentPattern");
      this.left = left;
      this.right = right;
    }
  }
  class SwitchExpression extends ASTNode {
    constructor(discriminant, cases) {
      super("SwitchExpression");
      this.discriminant = discriminant;
      this.cases = cases;
    }
  }
  class SwitchCase extends ASTNode {
    constructor(test, consequent) {
      super("SwitchCase");
      this.test = test;
      this.consequent = consequent;
    }
  }

  var __defProp$v = Object.defineProperty;
  var __defNormalProp$v = (obj, key, value) => key in obj ? __defProp$v(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$v = (obj, key, value) => __defNormalProp$v(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Parser {
    constructor(tokens) {
      __publicField$v(this, "tokens");
      __publicField$v(this, "pos");
      this.tokens = tokens;
      this.pos = 0;
    }
    // Utility methods
    peek(offset = 0) {
      return this.tokens[this.pos + offset] || this.tokens[this.tokens.length - 1];
    }
    advance() {
      return this.tokens[this.pos++];
    }
    match(type, value = null) {
      const token = this.peek();
      if (token.type !== type) return false;
      if (value !== null && token.value !== value) return false;
      return true;
    }
    expect(type, value = null) {
      const token = this.peek();
      if (token.type !== type) {
        throw new Error(`Expected ${type} but got ${token.type} at ${token.line}:${token.column}`);
      }
      if (value !== null && token.value !== value) {
        throw new Error(`Expected '${value}' but got '${token.value}' at ${token.line}:${token.column}`);
      }
      return this.advance();
    }
    skipNewlines() {
      while (this.match(TokenType.NEWLINE)) {
        this.advance();
      }
    }
    // Main parse method
    parse() {
      const body = [];
      while (!this.match(TokenType.EOF)) {
        this.skipNewlines();
        if (this.match(TokenType.EOF)) break;
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
        this.skipNewlines();
      }
      return new Program(body);
    }
    // Parse statement
    parseStatement() {
      this.skipNewlines();
      const startLine = this.peek().line;
      if (this.match(TokenType.COMMENT)) {
        this.advance();
        return null;
      }
      let stmt;
      if (this.match(TokenType.KEYWORD, "type")) {
        stmt = this.parseTypeDefinition();
      } else if (this.match(TokenType.KEYWORD, "var") || this.match(TokenType.KEYWORD, "varip")) {
        stmt = this.parseVarDeclaration();
      } else if (this.match(TokenType.KEYWORD, "method")) {
        stmt = this.parseMethodDeclaration();
      } else if (this.isFunctionDeclaration()) {
        stmt = this.parseFunctionDeclaration();
      } else if (this.match(TokenType.KEYWORD, "if")) {
        stmt = this.parseIfStatement();
      } else if (this.match(TokenType.KEYWORD, "for")) {
        stmt = this.parseForStatement();
      } else if (this.match(TokenType.KEYWORD, "while")) {
        stmt = this.parseWhileStatement();
      } else if (this.match(TokenType.KEYWORD, "break") || this.match(TokenType.KEYWORD, "continue")) {
        const keyword = this.advance().value;
        stmt = new ExpressionStatement(new Identifier(keyword));
      } else if (this.isTupleDestructuring()) {
        stmt = this.parseTupleDestructuring();
      } else if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER) {
        let offset = 2;
        while (this.peek(offset).type === TokenType.IDENTIFIER) {
          offset++;
        }
        if (this.peek(offset).type === TokenType.OPERATOR && this.peek(offset).value === "=") {
          stmt = this.parseTypedVarDeclaration();
        }
      }
      if (!stmt) {
        const expr = this.parseExpression();
        if (this.match(TokenType.OPERATOR)) {
          const op = this.peek().value;
          if (["=", ":=", "+=", "-=", "*=", "/=", "%="].includes(op)) {
            this.advance();
            this.skipNewlines();
            const right = this.parseExpression();
            if (op === "=" && expr.type === "Identifier") {
              stmt = new VariableDeclaration([new VariableDeclarator(expr, right)], VariableDeclarationKind.LET);
            } else {
              stmt = new ExpressionStatement(new AssignmentExpression(op === ":=" ? "=" : op, expr, right));
            }
          } else {
            stmt = new ExpressionStatement(expr);
          }
        } else {
          stmt = new ExpressionStatement(expr);
        }
      }
      if (stmt) {
        stmt._line = startLine;
      }
      return stmt;
    }
    // Check if current position is function declaration
    isFunctionDeclaration() {
      const saved = this.pos;
      try {
        let i = 0;
        if (this.peek(i).type === TokenType.IDENTIFIER && this.peek(i + 1).type === TokenType.IDENTIFIER) {
          i++;
        }
        if (this.peek(i).type !== TokenType.IDENTIFIER) {
          return false;
        }
        i++;
        if (this.peek(i).type !== TokenType.LPAREN) {
          return false;
        }
        i++;
        let depth = 1;
        while (depth > 0 && this.peek(i).type !== TokenType.EOF) {
          if (this.peek(i).type === TokenType.LPAREN) depth++;
          if (this.peek(i).type === TokenType.RPAREN) depth--;
          i++;
        }
        while (this.peek(i).type === TokenType.NEWLINE) i++;
        return this.peek(i).type === TokenType.OPERATOR && this.peek(i).value === "=>";
      } finally {
        this.pos = saved;
      }
    }
    // Parse type definition (v5: type X => fields, v6: type X\n fields)
    parseTypeDefinition() {
      this.expect(TokenType.KEYWORD, "type");
      const name = this.expect(TokenType.IDENTIFIER).value;
      const hasArrow = this.match(TokenType.OPERATOR, "=>");
      if (hasArrow) {
        this.advance();
      }
      this.skipNewlines();
      this.expect(TokenType.INDENT);
      const fields = [];
      while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
        this.skipNewlines();
        if (this.match(TokenType.DEDENT)) break;
        const fieldType = this.expect(TokenType.IDENTIFIER).value;
        const fieldName = this.expect(TokenType.IDENTIFIER).value;
        let defaultValue = null;
        if (this.match(TokenType.OPERATOR, "=")) {
          this.advance();
          this.skipNewlines();
          defaultValue = this.parseExpression();
        }
        fields.push({ type: fieldType, name: fieldName, defaultValue });
        this.skipNewlines();
      }
      if (this.match(TokenType.DEDENT)) {
        this.advance();
      }
      return new TypeDefinition(name, fields);
    }
    // Parse var/varip declaration
    parseVarDeclaration() {
      const keyword = this.advance();
      const kind = keyword.value;
      let varType = null;
      let name = null;
      if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.LBRACKET && this.peek(2).type === TokenType.RBRACKET) {
        varType = this.advance().value;
        this.advance();
        varType += "[]";
        this.advance();
        name = this.expect(TokenType.IDENTIFIER).value;
      } else if (this.peek().type === TokenType.IDENTIFIER && (this.peek(1).type === TokenType.IDENTIFIER || this.peek(1).type === TokenType.OPERATOR && this.peek(1).value === "<")) {
        varType = this.advance().value;
        if (this.match(TokenType.OPERATOR, "<")) {
          this.advance();
          varType += "<";
          while (!this.match(TokenType.OPERATOR, ">")) {
            if (this.match(TokenType.IDENTIFIER)) {
              varType += this.advance().value;
            } else if (this.match(TokenType.COMMA)) {
              varType += this.advance().value;
              this.skipNewlines();
            } else {
              break;
            }
          }
          if (this.match(TokenType.OPERATOR, ">")) {
            varType += ">";
            this.advance();
          }
        }
        name = this.expect(TokenType.IDENTIFIER).value;
      } else if (this.peek().type === TokenType.IDENTIFIER) {
        name = this.advance().value;
      } else {
        throw new Error(`Expected identifier after ${kind} at ${this.peek().line}:${this.peek().column}`);
      }
      this.expect(TokenType.OPERATOR, "=");
      this.skipNewlines();
      const init = this.parseExpression();
      const id = new Identifier(name);
      if (varType) {
        id.varType = varType;
      }
      return new VariableDeclaration([new VariableDeclarator(id, init, varType)], kind);
    }
    // Parse typed variable declaration (int x = ... or series float x = ...)
    parseTypedVarDeclaration() {
      let varType = this.advance().value;
      while (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER) {
        varType += " " + this.advance().value;
      }
      const name = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.OPERATOR, "=");
      this.skipNewlines();
      const init = this.parseExpression();
      const id = new Identifier(name);
      id.varType = varType;
      return new VariableDeclaration([new VariableDeclarator(id, init, varType)], VariableDeclarationKind.LET);
    }
    // Parse function declaration
    parseFunctionDeclaration() {
      let returnType = null;
      if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER) {
        returnType = this.advance().value;
      }
      const name = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.LPAREN);
      const params = [];
      while (!this.match(TokenType.RPAREN)) {
        this.skipNewlines();
        if (this.match(TokenType.RPAREN)) break;
        let paramType = null;
        while (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER && this.peek(2).type !== TokenType.LPAREN) {
          if (paramType) {
            paramType += " ";
          }
          paramType = (paramType || "") + this.advance().value;
        }
        const paramName = this.expect(TokenType.IDENTIFIER).value;
        const param = new Identifier(paramName);
        if (paramType) param.varType = paramType;
        if (this.match(TokenType.OPERATOR, "=")) {
          this.advance();
          this.skipNewlines();
          const defaultValue = this.parseExpression();
          params.push(new AssignmentPattern(param, defaultValue));
        } else {
          params.push(param);
        }
        if (this.match(TokenType.COMMA)) {
          this.advance();
        }
      }
      this.expect(TokenType.RPAREN);
      this.skipNewlines();
      this.expect(TokenType.OPERATOR, "=>");
      this.skipNewlines();
      const body = this.parseFunctionBody();
      const id = new Identifier(name);
      if (returnType) id.returnType = returnType;
      return new FunctionDeclaration(id, params, body, returnType);
    }
    // Parse method declaration (method name(Type this, params) => ...)
    parseMethodDeclaration() {
      this.expect(TokenType.KEYWORD, "method");
      let returnType = null;
      if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER && this.peek(2).type === TokenType.LPAREN) {
        returnType = this.advance().value;
      }
      const name = this.expect(TokenType.IDENTIFIER).value;
      this.expect(TokenType.LPAREN);
      const params = [];
      while (!this.match(TokenType.RPAREN)) {
        this.skipNewlines();
        if (this.match(TokenType.RPAREN)) break;
        let paramType = null;
        while (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER && this.peek(2).type !== TokenType.LPAREN) {
          if (paramType) {
            paramType += " ";
          }
          paramType = (paramType || "") + this.advance().value;
        }
        const paramName = this.expect(TokenType.IDENTIFIER).value;
        const param = new Identifier(paramName);
        if (paramType) param.varType = paramType;
        if (this.match(TokenType.OPERATOR, "=")) {
          this.advance();
          this.skipNewlines();
          const defaultValue = this.parseExpression();
          params.push(new AssignmentPattern(param, defaultValue));
        } else {
          params.push(param);
        }
        if (this.match(TokenType.COMMA)) {
          this.advance();
        }
      }
      this.expect(TokenType.RPAREN);
      this.skipNewlines();
      this.expect(TokenType.OPERATOR, "=>");
      this.skipNewlines();
      const body = this.parseFunctionBody();
      const id = new Identifier(name);
      if (returnType) id.returnType = returnType;
      id.isMethod = true;
      return new FunctionDeclaration(id, params, body, returnType);
    }
    // Parse function body (handles both single expression and block)
    parseFunctionBody() {
      const statements = [];
      if (!this.match(TokenType.INDENT)) {
        const expr = this.parseExpression();
        return new BlockStatement([new ReturnStatement(expr)]);
      }
      this.advance();
      while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
        this.skipNewlines();
        if (this.match(TokenType.DEDENT)) break;
        const stmts = this.parseStatementOrSequence();
        if (Array.isArray(stmts)) {
          statements.push(...stmts);
        } else if (stmts) {
          statements.push(stmts);
        }
      }
      if (this.match(TokenType.DEDENT)) {
        this.advance();
      }
      if (statements.length > 0) {
        const last = statements[statements.length - 1];
        if (last.type === "ExpressionStatement") {
          statements[statements.length - 1] = new ReturnStatement(last.expression);
        }
      }
      return new BlockStatement(statements);
    }
    // Parse statement or comma-separated sequence
    parseStatementOrSequence() {
      this.pos;
      const startLine = this.peek().line;
      if (this.match(TokenType.KEYWORD, "if")) {
        const stmt = this.parseIfStatement();
        if (stmt) stmt._line = startLine;
        return stmt;
      }
      if (this.match(TokenType.KEYWORD, "for")) {
        return this.parseForStatement();
      }
      if (this.match(TokenType.KEYWORD, "while")) {
        return this.parseWhileStatement();
      }
      if (this.match(TokenType.KEYWORD, "break") || this.match(TokenType.KEYWORD, "continue")) {
        const keyword = this.advance().value;
        return new ExpressionStatement(new Identifier(keyword));
      }
      if (this.match(TokenType.KEYWORD, "var") || this.match(TokenType.KEYWORD, "varip")) {
        return this.parseVarDeclaration();
      }
      if (this.isTupleDestructuring()) {
        return this.parseTupleDestructuring();
      }
      if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER) {
        let offset = 2;
        while (this.peek(offset).type === TokenType.IDENTIFIER) {
          offset++;
        }
        if (this.peek(offset).type === TokenType.OPERATOR && this.peek(offset).value === "=") {
          return this.parseTypedVarDeclaration();
        }
      }
      const sequenceItems = [];
      while (true) {
        const expr = this.parseExpression();
        if (this.match(TokenType.OPERATOR)) {
          const op = this.peek().value;
          if (["=", ":=", "+=", "-=", "*=", "/=", "%="].includes(op)) {
            this.advance();
            this.skipNewlines();
            const right = this.parseExpression();
            if (op === "=" && expr.type === "Identifier") {
              sequenceItems.push(new VariableDeclaration([new VariableDeclarator(expr, right)], VariableDeclarationKind.LET));
            } else {
              sequenceItems.push(new ExpressionStatement(new AssignmentExpression(op === ":=" ? "=" : op, expr, right)));
            }
            if (this.match(TokenType.COMMA)) {
              this.advance();
              this.skipNewlines();
              continue;
            }
            break;
          } else {
            if (sequenceItems.length > 0) {
              sequenceItems.push(new ExpressionStatement(expr));
            } else {
              return new ExpressionStatement(expr);
            }
            break;
          }
        } else {
          if (this.match(TokenType.COMMA)) {
            sequenceItems.push(new ExpressionStatement(expr));
            this.advance();
            this.skipNewlines();
            continue;
          } else {
            if (sequenceItems.length > 0) {
              sequenceItems.push(new ExpressionStatement(expr));
            } else {
              return new ExpressionStatement(expr);
            }
            break;
          }
        }
      }
      if (sequenceItems.length > 1) {
        return sequenceItems;
      } else if (sequenceItems.length === 1) {
        return sequenceItems[0];
      }
      return null;
    }
    // Parse if statement
    parseIfStatement() {
      this.expect(TokenType.KEYWORD, "if");
      const test = this.parseExpression();
      this.skipNewlines();
      const consequent = this.parseBlock();
      let alternate = null;
      if (this.match(TokenType.KEYWORD, "else")) {
        this.advance();
        this.skipNewlines();
        if (this.match(TokenType.KEYWORD, "if")) {
          alternate = this.parseIfStatement();
        } else {
          alternate = this.parseBlock();
        }
      }
      return new IfStatement(test, consequent, alternate);
    }
    // Parse for statement (both range-based and for-in)
    parseForStatement() {
      this.expect(TokenType.KEYWORD, "for");
      let loopVar = null;
      let isDestructuring = false;
      if (this.match(TokenType.LBRACKET)) {
        this.advance();
        const elements = [];
        while (!this.match(TokenType.RBRACKET)) {
          this.skipNewlines();
          elements.push(new Identifier(this.expect(TokenType.IDENTIFIER).value));
          if (this.match(TokenType.COMMA)) {
            this.advance();
          }
        }
        this.expect(TokenType.RBRACKET);
        loopVar = new ArrayPattern(elements);
        isDestructuring = true;
      } else {
        const varName = this.expect(TokenType.IDENTIFIER).value;
        loopVar = new Identifier(varName);
      }
      if (this.match(TokenType.KEYWORD, "in")) {
        this.advance();
        const iterable = this.parseExpression();
        this.skipNewlines();
        const body = this.parseBlock();
        const init = new VariableDeclaration([new VariableDeclarator(loopVar, iterable)], VariableDeclarationKind.CONST);
        const forStmt = new ForStatement(init, null, null, body);
        forStmt.isForIn = true;
        return forStmt;
      } else {
        if (isDestructuring) {
          throw new Error(`Range-based for loops don't support destructuring at ${this.peek().line}:${this.peek().column}`);
        }
        this.expect(TokenType.OPERATOR, "=");
        const start = this.parseExpression();
        this.expect(TokenType.KEYWORD, "to");
        const end = this.parseExpression();
        let step = null;
        if (this.match(TokenType.KEYWORD, "by")) {
          this.advance();
          step = this.parseExpression();
        }
        this.skipNewlines();
        const body = this.parseBlock();
        const init = new VariableDeclaration([new VariableDeclarator(loopVar, start)], VariableDeclarationKind.LET);
        const test = new BinaryExpression("<=", loopVar, end);
        const update = step ? new AssignmentExpression("+=", loopVar, step) : new UpdateExpression("++", loopVar);
        return new ForStatement(init, test, update, body);
      }
    }
    // Parse while statement
    parseWhileStatement() {
      this.expect(TokenType.KEYWORD, "while");
      const test = this.parseExpression();
      this.skipNewlines();
      const body = this.parseBlock();
      return new WhileStatement(test, body);
    }
    // Parse indented block
    parseBlock() {
      if (!this.match(TokenType.INDENT)) {
        const stmt = this.parseStatement();
        return new BlockStatement(stmt ? [stmt] : []);
      }
      this.advance();
      const statements = [];
      while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
        this.skipNewlines();
        if (this.match(TokenType.DEDENT)) break;
        const stmt = this.parseStatement();
        if (stmt) statements.push(stmt);
      }
      if (this.match(TokenType.DEDENT)) {
        this.advance();
      }
      return new BlockStatement(statements);
    }
    // Check if current position looks like tuple destructuring
    isTupleDestructuring() {
      if (!this.match(TokenType.LBRACKET)) return false;
      let i = 1;
      while (true) {
        while (this.peek(i).type === TokenType.NEWLINE) i++;
        if (this.peek(i).type !== TokenType.IDENTIFIER) return false;
        i++;
        while (this.peek(i).type === TokenType.NEWLINE) i++;
        if (this.peek(i).type === TokenType.RBRACKET) {
          i++;
          break;
        } else if (this.peek(i).type === TokenType.COMMA) {
          i++;
          continue;
        } else {
          return false;
        }
      }
      while (this.peek(i).type === TokenType.NEWLINE) i++;
      return this.peek(i).type === TokenType.OPERATOR && this.peek(i).value === "=";
    }
    // Parse tuple destructuring
    parseTupleDestructuring() {
      this.expect(TokenType.LBRACKET);
      const elements = [];
      while (!this.match(TokenType.RBRACKET)) {
        this.skipNewlines();
        elements.push(new Identifier(this.expect(TokenType.IDENTIFIER).value));
        if (this.match(TokenType.COMMA)) {
          this.advance();
        }
      }
      this.expect(TokenType.RBRACKET);
      this.skipNewlines();
      this.expect(TokenType.OPERATOR, "=");
      this.skipNewlines();
      const init = this.parseExpression();
      return new VariableDeclaration([new VariableDeclarator(new ArrayPattern(elements), init)], VariableDeclarationKind.CONST);
    }
    // Expression parsing (operator precedence)
    parseExpression() {
      return this.parseTernary();
    }
    parseTernary() {
      let expr = this.parseLogicalOr();
      if (this.match(TokenType.OPERATOR, "?")) {
        this.advance();
        this.skipNewlines();
        const consequent = this.parseExpression();
        this.expect(TokenType.COLON);
        this.skipNewlines();
        const alternate = this.parseExpression();
        return new ConditionalExpression(expr, consequent, alternate);
      }
      return expr;
    }
    parseLogicalOr() {
      let left = this.parseLogicalAnd();
      while (this.match(TokenType.KEYWORD, "or") || this.match(TokenType.OPERATOR) && this.peek().value === "||") {
        this.advance();
        this.skipNewlines();
        const right = this.parseLogicalAnd();
        left = new BinaryExpression("||", left, right);
      }
      return left;
    }
    parseLogicalAnd() {
      let left = this.parseEquality();
      while (this.match(TokenType.KEYWORD, "and") || this.match(TokenType.OPERATOR) && this.peek().value === "&&") {
        this.advance();
        this.skipNewlines();
        const right = this.parseEquality();
        left = new BinaryExpression("&&", left, right);
      }
      return left;
    }
    parseEquality() {
      let left = this.parseComparison();
      while (this.match(TokenType.OPERATOR)) {
        const op = this.peek().value;
        if (!["==", "!="].includes(op)) break;
        this.advance();
        this.skipNewlines();
        const right = this.parseComparison();
        left = new BinaryExpression(op, left, right);
      }
      return left;
    }
    parseComparison() {
      let left = this.parseAdditive();
      while (this.match(TokenType.OPERATOR)) {
        const op = this.peek().value;
        if (!["<", ">", "<=", ">="].includes(op)) break;
        this.advance();
        this.skipNewlines();
        const right = this.parseAdditive();
        left = new BinaryExpression(op, left, right);
      }
      return left;
    }
    parseAdditive() {
      let left = this.parseMultiplicative();
      while (this.match(TokenType.OPERATOR)) {
        const op = this.peek().value;
        if (!["+", "-"].includes(op)) break;
        this.advance();
        this.skipNewlines();
        const right = this.parseMultiplicative();
        left = new BinaryExpression(op, left, right);
      }
      return left;
    }
    parseMultiplicative() {
      let left = this.parseUnary();
      while (this.match(TokenType.OPERATOR)) {
        const op = this.peek().value;
        if (!["*", "/", "%"].includes(op)) break;
        this.advance();
        this.skipNewlines();
        const right = this.parseUnary();
        left = new BinaryExpression(op, left, right);
      }
      return left;
    }
    parseUnary() {
      if (this.match(TokenType.OPERATOR)) {
        const op = this.peek().value;
        if (["+", "-", "!"].includes(op)) {
          this.advance();
          this.skipNewlines();
          return new UnaryExpression(op, this.parseUnary());
        }
      }
      if (this.match(TokenType.KEYWORD, "not")) {
        this.advance();
        this.skipNewlines();
        return new UnaryExpression("!", this.parseUnary());
      }
      return this.parsePostfix();
    }
    parsePostfix() {
      let expr = this.parsePrimary();
      while (true) {
        if (this.match(TokenType.OPERATOR, "<")) {
          const saved = this.pos;
          this.advance();
          let depth = 1;
          let isGeneric = true;
          while (depth > 0 && !this.match(TokenType.EOF)) {
            if (this.match(TokenType.OPERATOR, "<")) {
              depth++;
              this.advance();
            } else if (this.match(TokenType.OPERATOR, ">")) {
              depth--;
              this.advance();
            } else if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.COMMA)) {
              this.advance();
            } else {
              isGeneric = false;
              this.pos = saved;
              break;
            }
          }
          if (isGeneric && this.match(TokenType.LPAREN)) {
            expr = this.parseCallExpression(expr);
            continue;
          } else if (!isGeneric) {
            break;
          } else {
            continue;
          }
        } else if (this.match(TokenType.LPAREN)) {
          expr = this.parseCallExpression(expr);
        } else if (this.match(TokenType.DOT)) {
          this.advance();
          this.skipNewlines();
          const property = this.expect(TokenType.IDENTIFIER).value;
          expr = new MemberExpression(expr, new Identifier(property), false);
        } else if (this.match(TokenType.LBRACKET)) {
          this.advance();
          this.skipNewlines();
          const index = this.parseExpression();
          this.expect(TokenType.RBRACKET);
          expr = new MemberExpression(expr, index, true);
        } else {
          break;
        }
      }
      return expr;
    }
    parseCallExpression(callee) {
      this.expect(TokenType.LPAREN);
      const args = [];
      const namedArgs = [];
      while (!this.match(TokenType.RPAREN)) {
        this.skipNewlines();
        if (this.match(TokenType.RPAREN)) break;
        if ((this.peek().type === TokenType.IDENTIFIER || this.peek().type === TokenType.KEYWORD) && this.peek(1).type === TokenType.OPERATOR && this.peek(1).value === "=") {
          const name = this.advance().value;
          this.advance();
          this.skipNewlines();
          const value = this.parseExpression();
          namedArgs.push(new Property(new Identifier(name), value));
        } else {
          args.push(this.parseExpression());
        }
        if (this.match(TokenType.COMMA)) {
          this.advance();
        }
        this.skipNewlines();
      }
      this.expect(TokenType.RPAREN);
      if (namedArgs.length > 0) {
        args.push(new ObjectExpression(namedArgs));
      }
      return new CallExpression(callee, args);
    }
    parsePrimary() {
      const token = this.peek();
      if (this.match(TokenType.NUMBER)) {
        const num = this.advance();
        return new Literal(num.value);
      }
      if (this.match(TokenType.STRING)) {
        const str = this.advance();
        return new Literal(str.value);
      }
      if (this.match(TokenType.BOOLEAN)) {
        const bool = this.advance();
        return new Literal(bool.value);
      }
      if (this.match(TokenType.IDENTIFIER)) {
        const id = this.advance();
        return new Identifier(id.value);
      }
      if (this.match(TokenType.LBRACKET)) {
        return this.parseArrayLiteral();
      }
      if (this.match(TokenType.LPAREN)) {
        this.advance();
        this.skipNewlines();
        const expr = this.parseExpression();
        this.skipNewlines();
        this.expect(TokenType.RPAREN);
        return expr;
      }
      if (this.match(TokenType.KEYWORD, "if")) {
        return this.parseIfExpression();
      }
      if (this.match(TokenType.KEYWORD, "switch")) {
        return this.parseSwitchExpression();
      }
      throw new Error(`Unexpected token ${token.type} '${token.value}' at ${token.line}:${token.column}`);
    }
    parseArrayLiteral() {
      this.expect(TokenType.LBRACKET);
      const elements = [];
      while (!this.match(TokenType.RBRACKET)) {
        this.skipNewlines();
        if (this.match(TokenType.RBRACKET)) break;
        elements.push(this.parseExpression());
        if (this.match(TokenType.COMMA)) {
          this.advance();
        }
        this.skipNewlines();
      }
      this.expect(TokenType.RBRACKET);
      return new ArrayExpression(elements);
    }
    parseIfExpression() {
      this.expect(TokenType.KEYWORD, "if");
      const test = this.parseExpression();
      this.skipNewlines();
      this.expect(TokenType.INDENT);
      const consequentStmts = [];
      while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
        this.skipNewlines();
        if (this.match(TokenType.DEDENT)) break;
        const stmt = this.parseStatement();
        if (stmt) consequentStmts.push(stmt);
      }
      this.advance();
      let alternateStmts = [];
      if (this.match(TokenType.KEYWORD, "else")) {
        this.advance();
        this.skipNewlines();
        if (this.match(TokenType.KEYWORD, "if")) {
          const nestedIf = this.parseIfExpression();
          const needsIIFE2 = this.needsIIFE(consequentStmts, alternateStmts);
          if (needsIIFE2) {
            const condExpr = new ConditionalExpression(test, new BlockStatement(consequentStmts), nestedIf);
            condExpr.needsIIFE = true;
            condExpr.consequentStmts = consequentStmts;
            condExpr.alternateExpr = nestedIf;
            return condExpr;
          } else {
            return new ConditionalExpression(test, this.getBlockValue(consequentStmts), nestedIf);
          }
        } else {
          this.expect(TokenType.INDENT);
          while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
            this.skipNewlines();
            if (this.match(TokenType.DEDENT)) break;
            const stmt = this.parseStatement();
            if (stmt) alternateStmts.push(stmt);
          }
          this.advance();
        }
      }
      const needsIIFE = this.needsIIFE(consequentStmts, alternateStmts);
      if (needsIIFE) {
        const condExpr = new ConditionalExpression(test, new BlockStatement(consequentStmts), new BlockStatement(alternateStmts));
        condExpr.needsIIFE = true;
        condExpr.consequentStmts = consequentStmts;
        condExpr.alternateStmts = alternateStmts;
        return condExpr;
      }
      const consequent = this.getBlockValue(consequentStmts);
      const alternate = alternateStmts.length > 0 ? this.getBlockValue(alternateStmts) : new Literal(null);
      return new ConditionalExpression(test, consequent, alternate);
    }
    // Check if if-expression needs IIFE (multi-statement or has control flow)
    needsIIFE(consequentStmts, alternateStmts) {
      if (consequentStmts.length > 1 || alternateStmts.length > 1) {
        return true;
      }
      const hasControlFlow = (stmts) => {
        return stmts.some(
          (stmt) => stmt.type === "IfStatement" || stmt.type === "ForStatement" || stmt.type === "WhileStatement" || stmt.type === "BlockStatement"
        );
      };
      return hasControlFlow(consequentStmts) || hasControlFlow(alternateStmts);
    }
    parseSwitchExpression() {
      this.expect(TokenType.KEYWORD, "switch");
      const discriminant = this.parseExpression();
      this.skipNewlines();
      this.expect(TokenType.INDENT);
      const cases = [];
      while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
        this.skipNewlines();
        if (this.match(TokenType.DEDENT)) break;
        let test = null;
        if (!this.match(TokenType.OPERATOR, "=>")) {
          test = this.parseExpression();
        }
        this.expect(TokenType.OPERATOR, "=>");
        this.skipNewlines();
        const consequentStmts = [];
        if (this.match(TokenType.INDENT)) {
          this.advance();
          while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
            this.skipNewlines();
            if (this.match(TokenType.DEDENT)) break;
            const stmt = this.parseStatement();
            if (stmt) consequentStmts.push(stmt);
          }
          this.advance();
        } else {
          consequentStmts.push(new ExpressionStatement(this.parseExpression()));
        }
        const consequent = this.getBlockValue(consequentStmts);
        cases.push(new SwitchCase(test, consequent));
        this.skipNewlines();
      }
      this.advance();
      return new SwitchExpression(discriminant, cases);
    }
    getBlockValue(statements) {
      if (statements.length === 0) {
        return new Literal(null);
      }
      const last = statements[statements.length - 1];
      if (last.type === "ExpressionStatement") {
        return last.expression;
      }
      if (last.type === "VariableDeclaration" && last.declarations.length > 0) {
        return last.declarations[0].id;
      }
      return new Literal(null);
    }
  }

  var __defProp$u = Object.defineProperty;
  var __defNormalProp$u = (obj, key, value) => key in obj ? __defProp$u(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$u = (obj, key, value) => __defNormalProp$u(obj, typeof key !== "symbol" ? key + "" : key, value);
  class CodeGenerator {
    constructor(options = {}) {
      __publicField$u(this, "indent");
      __publicField$u(this, "indentStr");
      __publicField$u(this, "output");
      __publicField$u(this, "sourceCode");
      __publicField$u(this, "sourceLines");
      __publicField$u(this, "lastCommentedLine");
      __publicField$u(this, "includeSourceComments");
      this.indent = 0;
      this.indentStr = options.indentStr || "  ";
      this.output = [];
      this.sourceCode = options.sourceCode || null;
      this.sourceLines = this.sourceCode ? this.sourceCode.split("\n") : [];
      this.lastCommentedLine = -1;
      this.includeSourceComments = options.includeSourceComments || false;
    }
    generate(ast) {
      this.output = [];
      this.indent = 0;
      this.lastCommentedLine = -1;
      if (ast.type === "Program") {
        this.generateProgram(ast);
      } else {
        throw new Error(`Expected Program node, got ${ast.type}`);
      }
      return this.output.join("");
    }
    // Write source code comments
    writeSourceComment(startLine, endLine = null) {
      if (!this.sourceLines.length) return;
      const end = endLine || startLine;
      const linesToComment = [];
      for (let i = startLine - 1; i < end && i < this.sourceLines.length; i++) {
        if (i > this.lastCommentedLine) {
          const line = this.sourceLines[i].trim();
          if (line && !line.startsWith("//@") && !line.startsWith("//")) {
            linesToComment.push(this.sourceLines[i]);
          }
        }
      }
      if (linesToComment.length > 0) {
        for (const line of linesToComment) {
          this.write(this.indentStr.repeat(this.indent));
          this.write("/// ");
          this.write(line.trimEnd());
          this.write("\n");
        }
        this.lastCommentedLine = Math.max(this.lastCommentedLine, end - 1);
      }
    }
    // Helper to add indentation
    write(str) {
      this.output.push(str);
    }
    writeLine(str = "") {
      if (str) {
        this.output.push(this.indentStr.repeat(this.indent) + str + "\n");
      } else {
        this.output.push("\n");
      }
    }
    increaseIndent() {
      this.indent++;
    }
    decreaseIndent() {
      this.indent--;
    }
    // Generate Program node
    generateProgram(node) {
      for (let i = 0; i < node.body.length; i++) {
        this.generateStatement(node.body[i]);
        if (i < node.body.length - 1) {
          const current = node.body[i];
          const next = node.body[i + 1];
          if ((current.type === "FunctionDeclaration" || current.type === "TypeDefinition") && (next.type === "FunctionDeclaration" || next.type === "TypeDefinition")) {
            this.writeLine();
          }
        }
      }
    }
    // Generate any statement
    generateStatement(node) {
      if (this.includeSourceComments && node._line && this.sourceLines.length > 0) {
        this.writeSourceComment(node._line);
      }
      switch (node.type) {
        case "FunctionDeclaration":
          return this.generateFunctionDeclaration(node);
        case "VariableDeclaration":
          return this.generateVariableDeclaration(node);
        case "ExpressionStatement":
          return this.generateExpressionStatement(node);
        case "IfStatement":
          return this.generateIfStatement(node);
        case "ForStatement":
          return this.generateForStatement(node);
        case "WhileStatement":
          return this.generateWhileStatement(node);
        case "ReturnStatement":
          return this.generateReturnStatement(node);
        case "BlockStatement":
          return this.generateBlockStatement(node);
        case "TypeDefinition":
          return this.generateTypeDefinition(node);
        default:
          throw new Error(`Unknown statement type: ${node.type}`);
      }
    }
    // Generate TypeDefinition (convert to Type(...) call)
    generateTypeDefinition(node) {
      this.write(this.indentStr.repeat(this.indent));
      this.write(`const ${node.name} = Type({`);
      if (node.fields.length > 0) {
        this.write(" ");
        for (let i = 0; i < node.fields.length; i++) {
          const field = node.fields[i];
          this.write(`${field.name}: '${field.type}'`);
          if (i < node.fields.length - 1) {
            this.write(", ");
          }
        }
        this.write(" ");
      }
      this.write("});\n");
    }
    // Generate FunctionDeclaration
    generateFunctionDeclaration(node) {
      this.write(this.indentStr.repeat(this.indent));
      const isMethod = node.id.isMethod;
      this.write("function ");
      this.write(node.id.name);
      this.write("(");
      const params = node.params;
      const startIdx = isMethod && params.length > 0 && params[0].type === "Identifier" && params[0].name === "this" ? 1 : 0;
      for (let i = startIdx; i < params.length; i++) {
        const param = params[i];
        if (param.type === "Identifier") {
          this.write(param.name);
        } else if (param.type === "AssignmentPattern") {
          const leftName = param.left.name === "this" && isMethod ? "self" : param.left.name;
          this.write(leftName);
          this.write(" = ");
          this.generateExpression(param.right);
        }
        if (i < params.length - 1) {
          this.write(", ");
        }
      }
      this.write(") ");
      this.generateBlockStatement(node.body, false);
      this.write("\n");
    }
    // Generate VariableDeclaration
    generateVariableDeclaration(node) {
      const kind = node.kind === "var" || node.kind === "varip" ? "var" : "let";
      for (let i = 0; i < node.declarations.length; i++) {
        const decl = node.declarations[i];
        if (decl.init && decl.init.type === "ConditionalExpression" && decl.init.needsIIFE) {
          const varName = decl.id.type === "Identifier" ? decl.id.name : null;
          if (varName) {
            this.write(this.indentStr.repeat(this.indent));
            this.write(kind);
            this.write(" ");
            this.write(varName);
            this.write(";\n");
            this.generateIfStatementWithAssignment(decl.init, varName);
            continue;
          }
        }
        this.write(this.indentStr.repeat(this.indent));
        this.write(kind);
        this.write(" ");
        if (decl.id.type === "Identifier") {
          this.write(decl.id.name);
        } else if (decl.id.type === "ArrayPattern") {
          this.write("[");
          for (let j = 0; j < decl.id.elements.length; j++) {
            this.write(decl.id.elements[j].name);
            if (j < decl.id.elements.length - 1) {
              this.write(", ");
            }
          }
          this.write("]");
        }
        if (decl.init) {
          this.write(" = ");
          this.generateExpression(decl.init);
        }
        this.write(";\n");
      }
    }
    // Generate ExpressionStatement
    generateExpressionStatement(node) {
      this.write(this.indentStr.repeat(this.indent));
      this.generateExpression(node.expression);
      this.write(";\n");
    }
    // Generate IfStatement
    generateIfStatement(node) {
      this.write(this.indentStr.repeat(this.indent));
      this.write("if (");
      this.generateExpression(node.test);
      this.write(") ");
      this.generateBlockStatement(node.consequent, false);
      if (node.alternate) {
        this.write(" else ");
        if (node.alternate.type === "IfStatement") {
          this.generateIfStatement(node.alternate);
        } else {
          this.generateBlockStatement(node.alternate, false);
        }
      } else {
        this.write("\n");
      }
    }
    // Generate if statement that assigns to a variable (for complex if expressions)
    generateIfStatementWithAssignment(condExpr, varName) {
      this.write(this.indentStr.repeat(this.indent));
      this.write("if (");
      this.generateExpression(condExpr.test);
      this.write(") {\n");
      this.indent++;
      if (condExpr.consequentStmts) {
        for (let i = 0; i < condExpr.consequentStmts.length; i++) {
          const stmt = condExpr.consequentStmts[i];
          const isLast = i === condExpr.consequentStmts.length - 1;
          if (isLast) {
            if (stmt.type === "ExpressionStatement") {
              this.write(this.indentStr.repeat(this.indent));
              this.write(varName);
              this.write(" = ");
              this.generateExpression(stmt.expression);
              this.write(";\n");
            } else if (stmt.type === "IfStatement") {
              this.generateNestedIfWithAssignments(stmt, varName);
            } else {
              this.generateStatement(stmt);
            }
          } else {
            this.generateStatement(stmt);
          }
        }
      }
      this.indent--;
      this.write(this.indentStr.repeat(this.indent));
      this.write("}");
      if (condExpr.alternateExpr) {
        this.write(" else {\n");
        this.indent++;
        this.write(this.indentStr.repeat(this.indent));
        this.write(varName);
        this.write(" = ");
        this.generateExpression(condExpr.alternateExpr);
        this.write(";\n");
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}");
      } else if (condExpr.alternateStmts && condExpr.alternateStmts.length > 0) {
        this.write(" else {\n");
        this.indent++;
        for (let i = 0; i < condExpr.alternateStmts.length; i++) {
          const stmt = condExpr.alternateStmts[i];
          const isLast = i === condExpr.alternateStmts.length - 1;
          if (isLast) {
            if (stmt.type === "ExpressionStatement") {
              this.write(this.indentStr.repeat(this.indent));
              this.write(varName);
              this.write(" = ");
              this.generateExpression(stmt.expression);
              this.write(";\n");
            } else if (stmt.type === "IfStatement") {
              this.generateNestedIfWithAssignments(stmt, varName);
            } else {
              this.generateStatement(stmt);
            }
          } else {
            this.generateStatement(stmt);
          }
        }
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}");
      } else {
        this.write(" else {\n");
        this.indent++;
        this.write(this.indentStr.repeat(this.indent));
        this.write(varName);
        this.write(" = false;\n");
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}");
      }
      this.write("\n");
    }
    // Helper to generate nested if statement with assignments (no IIFE)
    generateNestedIfWithAssignments(node, varName) {
      this.write(this.indentStr.repeat(this.indent));
      this.write("if (");
      this.generateExpression(node.test);
      this.write(") {\n");
      this.indent++;
      if (node.consequent.type === "BlockStatement" && node.consequent.body.length > 0) {
        for (let i = 0; i < node.consequent.body.length; i++) {
          const stmt = node.consequent.body[i];
          const isLast = i === node.consequent.body.length - 1;
          if (isLast) {
            if (stmt.type === "ExpressionStatement") {
              this.write(this.indentStr.repeat(this.indent));
              this.write(varName);
              this.write(" = ");
              this.generateExpression(stmt.expression);
              this.write(";\n");
            } else if (stmt.type === "IfStatement") {
              this.generateNestedIfWithAssignments(stmt, varName);
            } else {
              this.generateStatement(stmt);
            }
          } else {
            this.generateStatement(stmt);
          }
        }
      }
      this.indent--;
      this.write(this.indentStr.repeat(this.indent));
      this.write("}");
      if (node.alternate) {
        if (node.alternate.type === "IfStatement") {
          this.write(" else ");
          this.write("if (");
          this.generateExpression(node.alternate.test);
          this.write(") {\n");
          this.indent++;
          if (node.alternate.consequent.type === "BlockStatement" && node.alternate.consequent.body.length > 0) {
            for (let i = 0; i < node.alternate.consequent.body.length; i++) {
              const stmt = node.alternate.consequent.body[i];
              const isLast = i === node.alternate.consequent.body.length - 1;
              if (isLast) {
                if (stmt.type === "ExpressionStatement") {
                  this.write(this.indentStr.repeat(this.indent));
                  this.write(varName);
                  this.write(" = ");
                  this.generateExpression(stmt.expression);
                  this.write(";\n");
                } else if (stmt.type === "IfStatement") {
                  this.generateNestedIfWithAssignments(stmt, varName);
                } else {
                  this.generateStatement(stmt);
                }
              } else {
                this.generateStatement(stmt);
              }
            }
          }
          this.indent--;
          this.write(this.indentStr.repeat(this.indent));
          this.write("}");
          this.generateNestedIfAlternatesWithAssignments(node.alternate.alternate, varName);
        } else if (node.alternate.type === "BlockStatement" && node.alternate.body.length > 0) {
          this.write(" else {\n");
          this.indent++;
          for (let i = 0; i < node.alternate.body.length; i++) {
            const stmt = node.alternate.body[i];
            const isLast = i === node.alternate.body.length - 1;
            if (isLast) {
              if (stmt.type === "ExpressionStatement") {
                this.write(this.indentStr.repeat(this.indent));
                this.write(varName);
                this.write(" = ");
                this.generateExpression(stmt.expression);
                this.write(";\n");
              } else if (stmt.type === "IfStatement") {
                this.generateNestedIfWithAssignments(stmt, varName);
              } else {
                this.generateStatement(stmt);
              }
            } else {
              this.generateStatement(stmt);
            }
          }
          this.indent--;
          this.write(this.indentStr.repeat(this.indent));
          this.write("}\n");
        } else {
          this.write(" else {\n");
          this.indent++;
          this.write(this.indentStr.repeat(this.indent));
          this.write(varName);
          this.write(" = false;\n");
          this.indent--;
          this.write(this.indentStr.repeat(this.indent));
          this.write("}\n");
        }
      } else {
        this.write("\n");
      }
    }
    // Helper to continue generating else if / else chain with assignments
    generateNestedIfAlternatesWithAssignments(alternate, varName) {
      if (!alternate) {
        return;
      }
      if (alternate.type === "IfStatement") {
        this.write(" else ");
        this.write("if (");
        this.generateExpression(alternate.test);
        this.write(") {\n");
        this.indent++;
        if (alternate.consequent.type === "BlockStatement" && alternate.consequent.body.length > 0) {
          for (let i = 0; i < alternate.consequent.body.length; i++) {
            const stmt = alternate.consequent.body[i];
            const isLast = i === alternate.consequent.body.length - 1;
            if (isLast) {
              if (stmt.type === "ExpressionStatement") {
                this.write(this.indentStr.repeat(this.indent));
                this.write(varName);
                this.write(" = ");
                this.generateExpression(stmt.expression);
                this.write(";\n");
              } else if (stmt.type === "IfStatement") {
                this.generateNestedIfWithAssignments(stmt, varName);
              } else {
                this.generateStatement(stmt);
              }
            } else {
              this.generateStatement(stmt);
            }
          }
        }
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}");
        this.generateNestedIfAlternatesWithAssignments(alternate.alternate, varName);
      } else if (alternate.type === "BlockStatement" && alternate.body.length > 0) {
        this.write(" else {\n");
        this.indent++;
        for (let i = 0; i < alternate.body.length; i++) {
          const stmt = alternate.body[i];
          const isLast = i === alternate.body.length - 1;
          if (isLast) {
            if (stmt.type === "ExpressionStatement") {
              this.write(this.indentStr.repeat(this.indent));
              this.write(varName);
              this.write(" = ");
              this.generateExpression(stmt.expression);
              this.write(";\n");
            } else if (stmt.type === "IfStatement") {
              this.generateNestedIfWithAssignments(stmt, varName);
            } else {
              this.generateStatement(stmt);
            }
          } else {
            this.generateStatement(stmt);
          }
        }
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}\n");
      } else {
        this.write(" else {\n");
        this.indent++;
        this.write(this.indentStr.repeat(this.indent));
        this.write(varName);
        this.write(" = false;\n");
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}\n");
      }
    }
    // Generate ForStatement
    generateForStatement(node) {
      this.write(this.indentStr.repeat(this.indent));
      if (node.isForIn) {
        this.write("for (");
        if (node.init && node.init.type === "VariableDeclaration") {
          const decl = node.init.declarations[0];
          this.write(`${node.init.kind} `);
          if (decl.id.type === "Identifier") {
            this.write(decl.id.name);
          } else if (decl.id.type === "ArrayPattern") {
            this.write("[");
            for (let i = 0; i < decl.id.elements.length; i++) {
              this.write(decl.id.elements[i].name);
              if (i < decl.id.elements.length - 1) {
                this.write(", ");
              }
            }
            this.write("]");
          }
          this.write(" of ");
          this.generateExpression(decl.init);
        }
        this.write(") ");
        this.generateBlockStatement(node.body, false);
        return;
      }
      this.write("for (");
      if (node.init) {
        if (node.init.type === "VariableDeclaration") {
          const decl = node.init.declarations[0];
          this.write(`${node.init.kind} ${decl.id.name}`);
          if (decl.init) {
            this.write(" = ");
            this.generateExpression(decl.init);
          }
        } else {
          this.generateExpression(node.init);
        }
      }
      this.write("; ");
      if (node.test) {
        this.generateExpression(node.test);
      }
      this.write("; ");
      if (node.update) {
        if (node.update.type === "AssignmentExpression") {
          this.generateExpression(node.update.left);
          this.write(` ${node.update.operator} `);
          this.generateExpression(node.update.right);
        } else {
          this.generateExpression(node.update);
        }
      }
      this.write(") ");
      this.generateBlockStatement(node.body, false);
    }
    // Generate WhileStatement
    generateWhileStatement(node) {
      this.write(this.indentStr.repeat(this.indent));
      this.write("while (");
      this.generateExpression(node.test);
      this.write(") ");
      this.generateBlockStatement(node.body, false);
    }
    // Generate ReturnStatement
    generateReturnStatement(node) {
      this.write(this.indentStr.repeat(this.indent));
      this.write("return");
      if (node.argument) {
        this.write(" ");
        this.generateExpression(node.argument);
      }
      this.write(";\n");
    }
    // Generate BlockStatement
    generateBlockStatement(node, addIndent = true) {
      this.write("{\n");
      if (addIndent) this.increaseIndent();
      else this.indent++;
      for (const stmt of node.body) {
        this.generateStatement(stmt);
      }
      if (addIndent) this.decreaseIndent();
      else this.indent--;
      this.write(this.indentStr.repeat(this.indent));
      this.write("}");
      if (addIndent) this.write("\n");
    }
    // Generate any expression
    generateExpression(node) {
      switch (node.type) {
        case "Identifier":
          return this.write(node.name);
        case "Literal":
          return this.generateLiteral(node);
        case "BinaryExpression":
        case "LogicalExpression":
          return this.generateBinaryExpression(node);
        case "UnaryExpression":
          return this.generateUnaryExpression(node);
        case "AssignmentExpression":
          return this.generateAssignmentExpression(node);
        case "UpdateExpression":
          return this.generateUpdateExpression(node);
        case "CallExpression":
          return this.generateCallExpression(node);
        case "MemberExpression":
          return this.generateMemberExpression(node);
        case "ConditionalExpression":
          return this.generateConditionalExpression(node);
        case "ArrayExpression":
          return this.generateArrayExpression(node);
        case "ObjectExpression":
          return this.generateObjectExpression(node);
        case "SwitchExpression":
          return this.generateSwitchExpression(node);
        case "SequenceExpression":
          return this.generateSequenceExpression(node);
        default:
          throw new Error(`Unknown expression type: ${node.type}`);
      }
    }
    // Generate Literal
    generateLiteral(node) {
      if (typeof node.value === "string") {
        const escaped = node.value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
        this.write(`'${escaped}'`);
      } else if (node.value === null) {
        this.write("null");
      } else {
        this.write(String(node.value));
      }
    }
    // Generate BinaryExpression
    generateBinaryExpression(node) {
      const currentPrecedence = this.getPrecedence(node);
      const leftPrecedence = this.getPrecedence(node.left);
      if (leftPrecedence < currentPrecedence) {
        this.write("(");
        this.generateExpression(node.left);
        this.write(")");
      } else {
        this.generateExpression(node.left);
      }
      this.write(" ");
      let op = node.operator;
      if (op === "and") op = "&&";
      else if (op === "or") op = "||";
      this.write(op);
      this.write(" ");
      const rightPrecedence = this.getPrecedence(node.right);
      let needsRightParens = rightPrecedence < currentPrecedence;
      if (rightPrecedence === currentPrecedence) {
        if (op === "-" || op === "/" || op === "%") {
          needsRightParens = true;
        }
      }
      if (needsRightParens) {
        this.write("(");
        this.generateExpression(node.right);
        this.write(")");
      } else {
        this.generateExpression(node.right);
      }
    }
    // Generate UnaryExpression
    generateUnaryExpression(node) {
      let op = node.operator;
      if (op === "not") op = "!";
      this.write(op);
      const argPrecedence = this.getPrecedence(node.argument);
      if (argPrecedence < 15) {
        this.write("(");
        this.generateExpression(node.argument);
        this.write(")");
      } else {
        this.generateExpression(node.argument);
      }
    }
    // Generate AssignmentExpression
    generateAssignmentExpression(node) {
      this.generateExpression(node.left);
      this.write(" ");
      let op = node.operator;
      if (op === ":=") op = "=";
      this.write(op);
      this.write(" ");
      this.generateExpression(node.right);
    }
    // Generate UpdateExpression
    generateUpdateExpression(node) {
      if (node.prefix) {
        this.write(node.operator);
        this.generateExpression(node.argument);
      } else {
        this.generateExpression(node.argument);
        this.write(node.operator);
      }
    }
    // Generate CallExpression
    generateCallExpression(node) {
      const calleePrecedence = this.getPrecedence(node.callee);
      if (calleePrecedence < 19) {
        this.write("(");
        this.generateExpression(node.callee);
        this.write(")");
      } else {
        this.generateExpression(node.callee);
      }
      this.write("(");
      for (let i = 0; i < node.arguments.length; i++) {
        const arg = node.arguments[i];
        if (arg.type === "AssignmentExpression" && arg.operator === "=") {
          this.generateExpression(arg.right);
        } else {
          this.generateExpression(arg);
        }
        if (i < node.arguments.length - 1) {
          this.write(", ");
        }
      }
      this.write(")");
    }
    // Generate MemberExpression
    generateMemberExpression(node) {
      const objPrecedence = this.getPrecedence(node.object);
      if (objPrecedence < 19) {
        this.write("(");
        this.generateExpression(node.object);
        this.write(")");
      } else {
        this.generateExpression(node.object);
      }
      if (node.computed) {
        this.write("[");
        this.generateExpression(node.property);
        this.write("]");
      } else {
        this.write(".");
        this.generateExpression(node.property);
      }
    }
    // Generate ConditionalExpression (ternary or IIFE)
    generateConditionalExpression(node) {
      if (node.needsIIFE) {
        this.generateIIFEConditional(node);
        return;
      }
      this.write("(");
      this.generateExpression(node.test);
      this.write(" ? ");
      this.generateExpression(node.consequent);
      this.write(" : ");
      this.generateExpression(node.alternate);
      this.write(")");
    }
    // Generate IIFE for complex if expressions
    generateIIFEConditional(node) {
      this.write("(() => {\n");
      this.indent++;
      this.generateIIFEIfBlock(node);
      this.indent--;
      this.write(this.indentStr.repeat(this.indent));
      this.write("})()");
    }
    // Helper to generate if block inside IIFE with returns
    generateIIFEIfBlock(node) {
      this.write(this.indentStr.repeat(this.indent));
      this.write("if (");
      this.generateExpression(node.test);
      this.write(") {\n");
      this.indent++;
      if (node.consequentStmts) {
        for (let i = 0; i < node.consequentStmts.length; i++) {
          const stmt = node.consequentStmts[i];
          const isLast = i === node.consequentStmts.length - 1;
          if (isLast) {
            if (stmt.type === "ExpressionStatement") {
              this.write(this.indentStr.repeat(this.indent));
              this.write("return ");
              this.generateExpression(stmt.expression);
              this.write(";\n");
            } else if (stmt.type === "IfStatement") {
              this.generateNestedIfWithReturns(stmt);
            } else {
              this.generateStatement(stmt);
            }
          } else {
            this.generateStatement(stmt);
          }
        }
      }
      this.indent--;
      this.write(this.indentStr.repeat(this.indent));
      this.write("}");
      if (node.alternateExpr) {
        this.write(" else {\n");
        this.indent++;
        this.write(this.indentStr.repeat(this.indent));
        this.write("return ");
        this.generateExpression(node.alternateExpr);
        this.write(";\n");
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}");
      } else if (node.alternateStmts && node.alternateStmts.length > 0) {
        this.write(" else {\n");
        this.indent++;
        for (let i = 0; i < node.alternateStmts.length; i++) {
          const stmt = node.alternateStmts[i];
          const isLast = i === node.alternateStmts.length - 1;
          if (isLast) {
            if (stmt.type === "ExpressionStatement") {
              this.write(this.indentStr.repeat(this.indent));
              this.write("return ");
              this.generateExpression(stmt.expression);
              this.write(";\n");
            } else if (stmt.type === "IfStatement") {
              this.generateNestedIfWithReturns(stmt);
            } else {
              this.generateStatement(stmt);
            }
          } else {
            this.generateStatement(stmt);
          }
        }
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}");
      } else {
        this.write(" else {\n");
        this.indent++;
        this.write(this.indentStr.repeat(this.indent));
        this.write("return false;\n");
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}");
      }
      this.write("\n");
    }
    // Helper to generate nested if statement with returns (for IIFE)
    generateNestedIfWithReturns(node) {
      this.write(this.indentStr.repeat(this.indent));
      this.write("if (");
      this.generateExpression(node.test);
      this.write(") {\n");
      this.indent++;
      if (node.consequent.type === "BlockStatement" && node.consequent.body.length > 0) {
        for (let i = 0; i < node.consequent.body.length; i++) {
          const stmt = node.consequent.body[i];
          const isLast = i === node.consequent.body.length - 1;
          if (isLast) {
            if (stmt.type === "ExpressionStatement") {
              this.write(this.indentStr.repeat(this.indent));
              this.write("return ");
              this.generateExpression(stmt.expression);
              this.write(";\n");
            } else if (stmt.type === "IfStatement") {
              this.generateNestedIfWithReturns(stmt);
            } else {
              this.generateStatement(stmt);
            }
          } else {
            this.generateStatement(stmt);
          }
        }
      }
      this.indent--;
      this.write(this.indentStr.repeat(this.indent));
      this.write("}");
      if (node.alternate) {
        if (node.alternate.type === "IfStatement") {
          this.write(" else ");
          this.write("if (");
          this.generateExpression(node.alternate.test);
          this.write(") {\n");
          this.indent++;
          if (node.alternate.consequent.type === "BlockStatement" && node.alternate.consequent.body.length > 0) {
            for (let i = 0; i < node.alternate.consequent.body.length; i++) {
              const stmt = node.alternate.consequent.body[i];
              const isLast = i === node.alternate.consequent.body.length - 1;
              if (isLast) {
                if (stmt.type === "ExpressionStatement") {
                  this.write(this.indentStr.repeat(this.indent));
                  this.write("return ");
                  this.generateExpression(stmt.expression);
                  this.write(";\n");
                } else if (stmt.type === "IfStatement") {
                  this.generateNestedIfWithReturns(stmt);
                } else {
                  this.generateStatement(stmt);
                }
              } else {
                this.generateStatement(stmt);
              }
            }
          }
          this.indent--;
          this.write(this.indentStr.repeat(this.indent));
          this.write("}");
          this.generateNestedIfAlternates(node.alternate.alternate);
        } else if (node.alternate.type === "BlockStatement" && node.alternate.body.length > 0) {
          this.write(" else {\n");
          this.indent++;
          for (let i = 0; i < node.alternate.body.length; i++) {
            const stmt = node.alternate.body[i];
            const isLast = i === node.alternate.body.length - 1;
            if (isLast) {
              if (stmt.type === "ExpressionStatement") {
                this.write(this.indentStr.repeat(this.indent));
                this.write("return ");
                this.generateExpression(stmt.expression);
                this.write(";\n");
              } else if (stmt.type === "IfStatement") {
                this.generateNestedIfWithReturns(stmt);
              } else {
                this.generateStatement(stmt);
              }
            } else {
              this.generateStatement(stmt);
            }
          }
          this.indent--;
          this.write(this.indentStr.repeat(this.indent));
          this.write("}\n");
        } else {
          this.write(" else {\n");
          this.indent++;
          this.write(this.indentStr.repeat(this.indent));
          this.write("return false;\n");
          this.indent--;
          this.write(this.indentStr.repeat(this.indent));
          this.write("}\n");
        }
      } else {
        this.write("\n");
      }
    }
    // Helper to continue generating else if / else chain
    generateNestedIfAlternates(alternate) {
      if (!alternate) {
        return;
      }
      if (alternate.type === "IfStatement") {
        this.write(" else ");
        this.write("if (");
        this.generateExpression(alternate.test);
        this.write(") {\n");
        this.indent++;
        if (alternate.consequent.type === "BlockStatement" && alternate.consequent.body.length > 0) {
          for (let i = 0; i < alternate.consequent.body.length; i++) {
            const stmt = alternate.consequent.body[i];
            const isLast = i === alternate.consequent.body.length - 1;
            if (isLast) {
              if (stmt.type === "ExpressionStatement") {
                this.write(this.indentStr.repeat(this.indent));
                this.write("return ");
                this.generateExpression(stmt.expression);
                this.write(";\n");
              } else if (stmt.type === "IfStatement") {
                this.generateNestedIfWithReturns(stmt);
              } else {
                this.generateStatement(stmt);
              }
            } else {
              this.generateStatement(stmt);
            }
          }
        }
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}");
        this.generateNestedIfAlternates(alternate.alternate);
      } else if (alternate.type === "BlockStatement" && alternate.body.length > 0) {
        this.write(" else {\n");
        this.indent++;
        for (let i = 0; i < alternate.body.length; i++) {
          const stmt = alternate.body[i];
          const isLast = i === alternate.body.length - 1;
          if (isLast) {
            if (stmt.type === "ExpressionStatement") {
              this.write(this.indentStr.repeat(this.indent));
              this.write("return ");
              this.generateExpression(stmt.expression);
              this.write(";\n");
            } else if (stmt.type === "IfStatement") {
              this.generateNestedIfWithReturns(stmt);
            } else {
              this.generateStatement(stmt);
            }
          } else {
            this.generateStatement(stmt);
          }
        }
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}\n");
      } else {
        this.write(" else {\n");
        this.indent++;
        this.write(this.indentStr.repeat(this.indent));
        this.write("return false;\n");
        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write("}\n");
      }
    }
    // Helper to generate nested if as expression return
    generateNestedIfAsExpression(node) {
      if (node.type === "IfStatement") {
        this.write("(");
        this.generateExpression(node.test);
        this.write(" ? ");
        if (node.consequent.type === "BlockStatement" && node.consequent.body.length > 0) {
          const lastStmt = node.consequent.body[node.consequent.body.length - 1];
          if (lastStmt.type === "ExpressionStatement") {
            this.generateExpression(lastStmt.expression);
          } else if (lastStmt.type === "IfStatement") {
            this.generateNestedIfAsExpression(lastStmt);
          }
        }
        this.write(" : ");
        if (node.alternate) {
          if (node.alternate.type === "IfStatement") {
            this.generateNestedIfAsExpression(node.alternate);
          } else if (node.alternate.type === "BlockStatement" && node.alternate.body.length > 0) {
            const lastStmt = node.alternate.body[node.alternate.body.length - 1];
            if (lastStmt.type === "ExpressionStatement") {
              this.generateExpression(lastStmt.expression);
            }
          } else {
            this.write("false");
          }
        } else {
          this.write("false");
        }
        this.write(")");
      }
    }
    // Generate ArrayExpression
    generateArrayExpression(node) {
      this.write("[");
      for (let i = 0; i < node.elements.length; i++) {
        this.generateExpression(node.elements[i]);
        if (i < node.elements.length - 1) {
          this.write(", ");
        }
      }
      this.write("]");
    }
    // Generate ObjectExpression
    generateObjectExpression(node) {
      this.write("{");
      for (let i = 0; i < node.properties.length; i++) {
        const prop = node.properties[i];
        if (prop.key.type === "Identifier") {
          this.write(prop.key.name);
        } else {
          this.generateExpression(prop.key);
        }
        this.write(": ");
        this.generateExpression(prop.value);
        if (i < node.properties.length - 1) {
          this.write(", ");
        }
      }
      this.write("}");
    }
    // Generate SwitchExpression (convert to ternary chain)
    generateSwitchExpression(node) {
      this.write("(");
      for (let i = 0; i < node.cases.length; i++) {
        const c = node.cases[i];
        if (c.test) {
          this.generateExpression(node.discriminant);
          this.write(" == ");
          this.generateExpression(c.test);
          this.write(" ? ");
          this.generateExpression(c.consequent);
          this.write(" : ");
        } else {
          this.generateExpression(c.consequent);
        }
      }
      const hasDefault = node.cases.some((c) => !c.test);
      if (!hasDefault) {
        this.write("undefined");
      }
      this.write(")");
    }
    // Generate SequenceExpression
    generateSequenceExpression(node) {
      this.write("(");
      for (let i = 0; i < node.expressions.length; i++) {
        this.generateExpression(node.expressions[i]);
        if (i < node.expressions.length - 1) {
          this.write(", ");
        }
      }
      this.write(")");
    }
    // Get operator precedence
    getPrecedence(node) {
      switch (node.type) {
        case "Literal":
        case "Identifier":
        case "ArrayExpression":
        case "ObjectExpression":
          return 20;
        case "CallExpression":
        case "MemberExpression":
          return 19;
        case "UnaryExpression":
        case "UpdateExpression":
          return 15;
        // !, +, -, ++, --
        case "BinaryExpression":
        case "LogicalExpression":
          switch (node.operator) {
            case "*":
            case "/":
            case "%":
              return 13;
            case "+":
            case "-":
              return 12;
            case "<":
            case "<=":
            case ">":
            case ">=":
              return 10;
            case "==":
            case "!=":
              return 9;
            case "and":
            // PineScript 'and'
            case "&&":
              return 5;
            case "or":
            // PineScript 'or'
            case "||":
              return 4;
            default:
              return 0;
          }
        case "ConditionalExpression":
          return 3;
        case "AssignmentExpression":
        case "AssignmentPattern":
          return 2;
        case "SequenceExpression":
          return 1;
        default:
          return 0;
      }
    }
  }

  function extractPineScriptVersion(sourceCode) {
    const versionRegex = /^\s*\/\/\s*@version\s*=\s*(\d+)\s*$/im;
    const match = sourceCode.match(versionRegex);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }
  function pineToJS(sourceCode, options = {}) {
    const version = extractPineScriptVersion(sourceCode);
    if (version === null) {
      return {
        success: false,
        version: null,
        error: "Pine Script version not found. Please add //@version=X comment to your script."
      };
    }
    if (version < 5) {
      return {
        success: false,
        version,
        error: `Pine Script version ${version} is not supported. Only version 5 and above are supported.`
      };
    }
    try {
      const lexer = new Lexer(sourceCode);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();
      const codegenOptions = { ...options, sourceCode };
      const codegen = new CodeGenerator(codegenOptions);
      const jsCode = codegen.generate(ast);
      return {
        success: true,
        version,
        code: jsCode,
        ast,
        tokens
      };
    } catch (error) {
      return {
        success: false,
        version,
        error: error.message,
        stack: error.stack
      };
    }
  }

  function getPineTSFromSource(source) {
    if (typeof source === "function") {
      return source.toString();
    } else {
      const pineScriptVersion = extractPineScriptVersion(source);
      if (pineScriptVersion === null) {
        return source;
      }
      if (pineScriptVersion >= 5) {
        const pineToJSResult = pineToJS(source);
        if (pineToJSResult.success) {
          return pineToJSResult.code;
        } else {
          throw new Error(`Failed to transpile Pine Script version ${pineScriptVersion}: ${pineToJSResult.error}`);
        }
      } else {
        throw new Error(`Unsupported Pine Script version ${pineScriptVersion}. Only version 5 and above are supported.`);
      }
    }
  }
  function transpile(source, options = { debug: false, ln: false }) {
    if (typeof options === "boolean") {
      options = { debug: options, ln: true };
    }
    const { debug } = options;
    let code = getPineTSFromSource(source);
    code = wrapInContextFunction(code);
    const sourceLines = debug ? code.split("\n") : [];
    const ast = parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: debug
    });
    transformNestedArrowFunctions(ast);
    normalizeNativeImports(ast);
    injectImplicitImports(ast);
    const scopeManager = new ScopeManager();
    preProcessContextBoundVars(ast, scopeManager);
    const originalParamName = runAnalysisPass(ast, scopeManager) || "";
    runTransformationPass(ast, scopeManager, originalParamName, options, sourceLines);
    transformEqualityChecks(ast);
    const baseGenerator$1 = baseGenerator || GENERATOR || undefined && undefined;
    const customGenerator = Object.assign({}, baseGenerator$1, {
      LineComment(node, state) {
        state.write("//" + node.value);
      }
    });
    const transformedCode = generate(ast, {
      generator: customGenerator,
      comments: debug
    });
    const _wraperFunction = new Function("", `var _r = ${transformedCode}
; return _r;`);
    return _wraperFunction(this);
  }

  function abs$1(context) {
    return (id) => {
      return new PineArrayObject(
        id.array.map((val) => Math.abs(val)),
        id.type,
        context
      );
    };
  }

  function avg$2(context) {
    return (id) => {
      let mean = 0;
      let count = 0;
      for (const item of id.array) {
        const val = Number(item);
        if (!isNaN(val)) {
          count++;
          mean += (val - mean) / count;
        }
      }
      if (count === 0) return NaN;
      return context.precision(mean);
    };
  }

  function binary_search(context) {
    return (id, value) => {
      const array = id.array;
      let low = 0;
      let high = array.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const midVal = array[mid];
        if (midVal === value) {
          return mid;
        }
        if (midVal < value) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return -1;
    };
  }

  function binary_search_leftmost(context) {
    return (id, value) => {
      const array = id.array;
      let low = 0;
      let high = array.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (array[mid] < value) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      if (low < array.length && array[low] === value) {
        return low;
      }
      return low - 1;
    };
  }

  function binary_search_rightmost(context) {
    return (id, value) => {
      const array = id.array;
      let low = 0;
      let high = array.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (array[mid] <= value) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      if (low > 0 && array[low - 1] === value) {
        return low - 1;
      }
      return low;
    };
  }

  function clear$1(context) {
    return (id) => {
      id.array.length = 0;
    };
  }

  function concat$1(context) {
    return (id, other) => {
      id.array.push(...other.array);
      return id;
    };
  }

  function copy$2(context) {
    return (id) => {
      return new PineArrayObject([...id.array], id.type, context);
    };
  }

  function covariance(context) {
    return (arr1, arr2, biased = true) => {
      const a1 = arr1.array;
      const a2 = arr2.array;
      if (a1.length !== a2.length) return NaN;
      let sum1 = 0;
      let sum2 = 0;
      let count = 0;
      const validIndices = [];
      for (let i = 0; i < a1.length; i++) {
        const v1 = Number(a1[i]);
        const v2 = Number(a2[i]);
        if (!isNaN(v1) && v1 !== null && v1 !== void 0 && !isNaN(v2) && v2 !== null && v2 !== void 0) {
          sum1 += v1;
          sum2 += v2;
          count++;
          validIndices.push(i);
        }
      }
      if (count === 0) return NaN;
      const mean1 = sum1 / count;
      const mean2 = sum2 / count;
      let sumProd = 0;
      for (const i of validIndices) {
        const v1 = Number(a1[i]);
        const v2 = Number(a2[i]);
        sumProd += (v1 - mean1) * (v2 - mean2);
      }
      const divisor = biased ? count : count - 1;
      if (divisor <= 0) return NaN;
      return context.precision(sumProd / divisor);
    };
  }

  function every(context) {
    return (id) => {
      return id.array.every((value) => !isNaN(value) && value);
    };
  }

  function inferArrayType(values) {
    if (values.every((value) => typeof value === "number")) {
      if (values.every((value) => (value | 0) === value)) {
        return PineArrayType.int;
      } else {
        return PineArrayType.float;
      }
    } else if (values.every((value) => typeof value === "string")) {
      return PineArrayType.string;
    } else if (values.every((value) => typeof value === "boolean")) {
      return PineArrayType.bool;
    } else {
      return PineArrayType.any;
    }
  }
  function inferValueType(value) {
    if (typeof value === "number") {
      if ((value | 0) === value) {
        return PineArrayType.int;
      } else {
        return PineArrayType.float;
      }
    } else if (typeof value === "string") {
      return PineArrayType.string;
    } else if (typeof value === "boolean") {
      return PineArrayType.bool;
    } else {
      throw new Error("Cannot infer type from value");
    }
  }
  function isValueOfType(value, type) {
    switch (type) {
      case PineArrayType.int:
        return typeof value === "number" && ((value | 0) === value || isNaN(value));
      case PineArrayType.float:
        return typeof value === "number";
      case PineArrayType.string:
        return typeof value === "string";
      case PineArrayType.bool:
        return typeof value === "boolean";
    }
    return false;
  }

  function fill$1(context) {
    return (id, value, start = 0, end) => {
      const length = id.array.length;
      const adjustedEnd = end !== void 0 ? Math.min(end, length) : length;
      for (let i = start; i < adjustedEnd; i++) {
        if (!isValueOfType(value, id.type)) {
          throw new Error(
            `Cannot call 'array.fill' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${id.type}' is expected.`
          );
        }
        id.array[i] = context.precision(value);
      }
    };
  }

  function first(context) {
    return (id) => {
      return id.array.length > 0 ? id.array[0] : context.NA;
    };
  }

  function get$2(context) {
    return (id, index) => {
      return id.array[index];
    };
  }

  function includes(context) {
    return (id, value) => {
      return id.array.includes(value);
    };
  }

  function indexof(context) {
    return (id, value) => {
      return id.array.indexOf(value);
    };
  }

  function insert(context) {
    return (id, index, value) => {
      if (!isValueOfType(value, id.type)) {
        throw new Error(
          `Cannot call 'array.insert' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${id.type}' is expected.`
        );
      }
      id.array.splice(index, 0, value);
    };
  }

  function join(context) {
    return (id, separator = ",") => {
      return id.array.join(separator);
    };
  }

  function last(context) {
    return (id) => {
      return id.array.length > 0 ? id.array[id.array.length - 1] : context.NA;
    };
  }

  function lastindexof(context) {
    return (id, value) => {
      return id.array.lastIndexOf(value);
    };
  }

  function max$2(context) {
    return (id, nth = 0) => {
      const sorted = [...id.array].sort((a, b) => b - a);
      return sorted[nth] ?? context.NA;
    };
  }

  function median$2(context) {
    return (id) => {
      if (id.array.length === 0) return NaN;
      const sorted = [...id.array].sort((a, b) => {
        if (typeof a === "number" && typeof b === "number") {
          return a - b;
        }
        return 0;
      });
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 !== 0) {
        return sorted[mid];
      }
      return (sorted[mid - 1] + sorted[mid]) / 2;
    };
  }

  function min$2(context) {
    return (id, nth = 0) => {
      const sorted = [...id.array].sort((a, b) => a - b);
      return sorted[nth] ?? context.NA;
    };
  }

  function mode$2(context) {
    return (id) => {
      if (id.array.length === 0) return NaN;
      const counts = /* @__PURE__ */ new Map();
      let maxFreq = 0;
      for (const val of id.array) {
        const count = (counts.get(val) || 0) + 1;
        counts.set(val, count);
        if (count > maxFreq) {
          maxFreq = count;
        }
      }
      const modes = [];
      for (const [val, count] of counts) {
        if (count === maxFreq) {
          modes.push(val);
        }
      }
      modes.sort((a, b) => {
        if (typeof a === "number" && typeof b === "number") {
          return a - b;
        }
        if (typeof a === "string" && typeof b === "string") {
          return a < b ? -1 : a > b ? 1 : 0;
        }
        return 0;
      });
      return modes[0];
    };
  }

  function percentile_linear_interpolation$1(context) {
    return (id, percentage) => {
      const array = id.array;
      if (array.length === 0) return NaN;
      const validValues = [];
      for (const item of array) {
        const val = Number(item);
        if (isNaN(val) || val === null || val === void 0) {
          return NaN;
        }
        validValues.push(val);
      }
      validValues.sort((a, b) => a - b);
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;
      const k = percentage / 100 * validValues.length - 0.5;
      if (k <= 0) return context.precision(validValues[0]);
      if (k >= validValues.length - 1) return context.precision(validValues[validValues.length - 1]);
      const i = Math.floor(k);
      const f = k - i;
      return context.precision(validValues[i] * (1 - f) + validValues[i + 1] * f);
    };
  }

  function percentile_nearest_rank$1(context) {
    return (id, percentage) => {
      const array = id.array;
      if (array.length === 0) return NaN;
      const validValues = [];
      for (const item of array) {
        const val = Number(item);
        if (!isNaN(val) && val !== null && val !== void 0) {
          validValues.push(val);
        }
      }
      if (validValues.length === 0) return NaN;
      validValues.sort((a, b) => a - b);
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;
      const totalCount = array.length;
      const rank = Math.ceil(percentage / 100 * totalCount);
      if (rank <= 0) {
        return validValues[0];
      }
      if (rank > validValues.length) return NaN;
      return validValues[rank - 1];
    };
  }

  function percentrank$1(context) {
    return (id, index) => {
      if (id.array.length === 0) return NaN;
      const idx = Math.floor(index);
      if (idx < 0 || idx >= id.array.length) return NaN;
      const value = Number(id.array[idx]);
      if (isNaN(value) || value === null || value === void 0) return NaN;
      let lessThan = 0;
      for (const item of id.array) {
        const val = Number(item);
        if (!isNaN(val) && val !== null && val !== void 0) {
          if (val < value) {
            lessThan++;
          }
        }
      }
      const divisor = id.array.length - 1;
      if (divisor <= 0) return NaN;
      return lessThan / divisor * 100;
    };
  }

  function pop(context) {
    return (id) => {
      return id.array.pop();
    };
  }

  function push(context) {
    return (id, value) => {
      if (!isValueOfType(value, id.type)) {
        throw new Error(
          `Cannot call 'array.push' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${id.type}' is expected.`
        );
      }
      id.array.push(context.precision(value));
    };
  }

  function range$1(context) {
    return (id) => {
      return context.precision(context.pine.array.max(id) - context.pine.array.min(id));
    };
  }

  function remove$1(context) {
    return (id, index) => {
      if (index >= 0 && index < id.array.length) {
        return id.array.splice(index, 1)[0];
      }
      return context.NA;
    };
  }

  function reverse$1(context) {
    return (id) => {
      id.array.reverse();
    };
  }

  function set$1(context) {
    return (id, index, value) => {
      if (!isValueOfType(value, id.type)) {
        throw new Error(
          `Cannot call 'array.set' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${id.type}' is expected.`
        );
      }
      id.array[index] = context.precision(value);
    };
  }

  function shift(context) {
    return (id) => {
      return id.array.shift();
    };
  }

  function size$2(context) {
    return (id) => {
      return id.array.length;
    };
  }

  function slice(context) {
    return (id, start, end) => {
      const adjustedEnd = end !== void 0 ? end : void 0;
      return new PineArrayObject(id.array.slice(start, adjustedEnd), id.type, context);
    };
  }

  function some(context) {
    return (id) => {
      return id.array.some((value) => !isNaN(value) && value);
    };
  }

  var order$1 = /* @__PURE__ */ ((order2) => {
    order2[order2["ascending"] = 1] = "ascending";
    order2[order2["descending"] = 0] = "descending";
    return order2;
  })(order$1 || {});
  var currency = /* @__PURE__ */ ((currency2) => {
    currency2["AED"] = "AED";
    currency2["ARS"] = "ARS";
    currency2["AUD"] = "AUD";
    currency2["BDT"] = "BDT";
    currency2["BHD"] = "BHD";
    currency2["BRL"] = "BRL";
    currency2["BTC"] = "BTC";
    currency2["CAD"] = "CAD";
    currency2["CHF"] = "CHF";
    currency2["CLP"] = "CLP";
    currency2["CNY"] = "CNY";
    currency2["COP"] = "COP";
    currency2["CZK"] = "CZK";
    currency2["DKK"] = "DKK";
    currency2["EGP"] = "EGP";
    currency2["ETH"] = "ETH";
    currency2["EUR"] = "EUR";
    currency2["GBP"] = "GBP";
    currency2["HKD"] = "HKD";
    currency2["HUF"] = "HUF";
    currency2["IDR"] = "IDR";
    currency2["ILS"] = "ILS";
    currency2["INR"] = "INR";
    currency2["ISK"] = "ISK";
    currency2["JPY"] = "JPY";
    currency2["KES"] = "KES";
    currency2["KRW"] = "KRW";
    currency2["KWD"] = "KWD";
    currency2["LKR"] = "LKR";
    currency2["MAD"] = "MAD";
    currency2["MXN"] = "MXN";
    currency2["MYR"] = "MYR";
    currency2["NGN"] = "NGN";
    currency2["NOK"] = "NOK";
    currency2["NONE"] = "NONE";
    currency2["NZD"] = "NZD";
    currency2["PEN"] = "PEN";
    currency2["PHP"] = "PHP";
    currency2["PKR"] = "PKR";
    currency2["PLN"] = "PLN";
    currency2["QAR"] = "QAR";
    currency2["RON"] = "RON";
    currency2["RSD"] = "RSD";
    currency2["RUB"] = "RUB";
    currency2["SAR"] = "SAR";
    currency2["SEK"] = "SEK";
    currency2["SGD"] = "SGD";
    currency2["THB"] = "THB";
    currency2["TND"] = "TND";
    currency2["TRY"] = "TRY";
    currency2["TWD"] = "TWD";
    currency2["USD"] = "USD";
    currency2["USDT"] = "USDT";
    currency2["VES"] = "VES";
    currency2["VND"] = "VND";
    currency2["ZAR"] = "ZAR";
    return currency2;
  })(currency || {});
  var dayofweek = /* @__PURE__ */ ((dayofweek2) => {
    dayofweek2[dayofweek2["sunday"] = 1] = "sunday";
    dayofweek2[dayofweek2["monday"] = 2] = "monday";
    dayofweek2[dayofweek2["tuesday"] = 3] = "tuesday";
    dayofweek2[dayofweek2["wednesday"] = 4] = "wednesday";
    dayofweek2[dayofweek2["thursday"] = 5] = "thursday";
    dayofweek2[dayofweek2["friday"] = 6] = "friday";
    dayofweek2[dayofweek2["saturday"] = 7] = "saturday";
    return dayofweek2;
  })(dayofweek || {});
  var display = /* @__PURE__ */ ((display2) => {
    display2["all"] = "all";
    display2["data_window"] = "data_window";
    display2["none"] = "none";
    display2["pane"] = "pane";
    display2["price_scale"] = "price_scale";
    display2["status_line"] = "status_line";
    return display2;
  })(display || {});
  var shape = /* @__PURE__ */ ((shape2) => {
    shape2["flag"] = "flag";
    shape2["arrowdown"] = "arrowdown";
    shape2["arrowup"] = "arrowup";
    shape2["circle"] = "circle";
    shape2["cross"] = "cross";
    shape2["diamond"] = "diamond";
    shape2["labeldown"] = "labeldown";
    shape2["labelup"] = "labelup";
    shape2["square"] = "square";
    shape2["triangledown"] = "triangledown";
    shape2["triangleup"] = "triangleup";
    shape2["xcross"] = "xcross";
    return shape2;
  })(shape || {});
  var location = /* @__PURE__ */ ((location2) => {
    location2["abovebar"] = "abovebar";
    location2["belowbar"] = "belowbar";
    location2["absolute"] = "absolute";
    location2["bottom"] = "bottom";
    location2["top"] = "top";
    return location2;
  })(location || {});
  var size$1 = /* @__PURE__ */ ((size2) => {
    size2["auto"] = "auto";
    size2["tiny"] = "tiny";
    size2["small"] = "small";
    size2["normal"] = "normal";
    size2["large"] = "large";
    size2["huge"] = "huge";
    return size2;
  })(size$1 || {});
  var format = /* @__PURE__ */ ((format2) => {
    format2["inherit"] = "inherit";
    format2["mintick"] = "mintick";
    format2["percent"] = "percent";
    format2["price"] = "price";
    format2["volume"] = "volume";
    return format2;
  })(format || {});
  var barmerge = /* @__PURE__ */ ((barmerge2) => {
    barmerge2["gaps_on"] = "gaps_on";
    barmerge2["gaps_off"] = "gaps_off";
    barmerge2["lookahead_on"] = "lookahead_on";
    barmerge2["lookahead_off"] = "lookahead_off";
    return barmerge2;
  })(barmerge || {});
  var adjustment = /* @__PURE__ */ ((adjustment2) => {
    adjustment2["dividends"] = "dividends";
    adjustment2["none"] = "none";
    adjustment2["splits"] = "splits";
    return adjustment2;
  })(adjustment || {});
  const alert = {
    freq: {
      all: "all",
      once_per_bar: "once_per_bar",
      once_per_bar_close: "once_per_bar_close"
    }
  };
  var backadjustment = /* @__PURE__ */ ((backadjustment2) => {
    backadjustment2["inherit"] = "inherit";
    backadjustment2["off"] = "off";
    backadjustment2["on"] = "on";
    return backadjustment2;
  })(backadjustment || {});
  var extend = /* @__PURE__ */ ((extend2) => {
    extend2["both"] = "both";
    extend2["left"] = "left";
    extend2["none"] = "none";
    extend2["right"] = "right";
    return extend2;
  })(extend || {});
  const font = {
    family: {
      default: "default",
      monospace: "monospace"
    }
  };
  var position$1 = /* @__PURE__ */ ((position2) => {
    position2["bottom_center"] = "bottom_center";
    position2["bottom_left"] = "bottom_left";
    position2["bottom_right"] = "bottom_right";
    position2["middle_center"] = "middle_center";
    position2["middle_left"] = "middle_left";
    position2["middle_right"] = "middle_right";
    position2["top_center"] = "top_center";
    position2["top_left"] = "top_left";
    position2["top_right"] = "top_right";
    return position2;
  })(position$1 || {});
  var scale = /* @__PURE__ */ ((scale2) => {
    scale2["left"] = "left";
    scale2["none"] = "none";
    scale2["right"] = "right";
    return scale2;
  })(scale || {});
  var settlement_as_close = /* @__PURE__ */ ((settlement_as_close2) => {
    settlement_as_close2["inherit"] = "inherit";
    settlement_as_close2["off"] = "off";
    settlement_as_close2["on"] = "on";
    return settlement_as_close2;
  })(settlement_as_close || {});
  var splits$1 = /* @__PURE__ */ ((splits2) => {
    splits2["denominator"] = "denominator";
    splits2["numerator"] = "numerator";
    return splits2;
  })(splits$1 || {});
  const text = {
    // Text alignment
    align_center: "center",
    align_left: "left",
    align_right: "right",
    align_top: "top",
    align_bottom: "bottom",
    // Text format
    format_inherit: "inherit",
    format_mintick: "mintick",
    format_percent: "percent",
    format_volume: "volume",
    // Text wrap
    wrap_auto: "auto",
    wrap_none: "none"
  };
  var xloc = /* @__PURE__ */ ((xloc2) => {
    xloc2["bar_index"] = "bar_index";
    xloc2["bar_time"] = "bar_time";
    return xloc2;
  })(xloc || {});
  var yloc = /* @__PURE__ */ ((yloc2) => {
    yloc2["abovebar"] = "abovebar";
    yloc2["belowbar"] = "belowbar";
    yloc2["price"] = "price";
    return yloc2;
  })(yloc || {});
  const label = {
    style_arrowdown: "arrowdown",
    style_arrowup: "arrowup",
    style_circle: "circle",
    style_cross: "cross",
    style_diamond: "diamond",
    style_flag: "flag",
    style_label_center: "label_center",
    style_label_down: "label_down",
    style_label_left: "label_left",
    style_label_lower_left: "label_lower_left",
    style_label_lower_right: "label_lower_right",
    style_label_right: "label_right",
    style_label_up: "label_up",
    style_label_upper_left: "label_upper_left",
    style_label_upper_right: "label_upper_right",
    style_none: "none",
    style_square: "square",
    style_text_outline: "text_outline",
    style_triangledown: "triangledown",
    style_triangleup: "triangleup",
    style_xcross: "xcross"
  };
  const line = {
    style_arrow_both: "arrow_both",
    style_arrow_left: "arrow_left",
    style_arrow_right: "arrow_right",
    style_dashed: "dashed",
    style_dotted: "dotted",
    style_solid: "solid"
  };
  const types = {
    order: order$1,
    currency,
    dayofweek,
    display,
    shape,
    location,
    size: size$1,
    format,
    barmerge,
    adjustment,
    alert,
    backadjustment,
    extend,
    font,
    position: position$1,
    scale,
    settlement_as_close,
    splits: splits$1,
    text,
    xloc,
    yloc,
    label,
    line
  };

  function sort$1(context) {
    return (id, _order = order$1.ascending) => {
      id.array.sort((a, b) => {
        let _a = isNaN(a) ? Infinity : a;
        let _b = isNaN(b) ? Infinity : b;
        return _order === order$1.ascending ? _a - _b : _b - _a;
      });
    };
  }

  function sort_indices(context) {
    return (id, _order = order$1.ascending) => {
      const indices = id.array.map((_, index) => index);
      indices.sort((a, b) => {
        const valA = isNaN(id.array[a]) ? Infinity : id.array[a];
        const valB = isNaN(id.array[b]) ? Infinity : id.array[b];
        return _order === order$1.ascending ? valA - valB : valB - valA;
      });
      return new PineArrayObject(indices, PineArrayType.int, context);
    };
  }

  function standardize(context) {
    return (id) => {
      const mean = context.array.avg(id);
      const stdev = context.array.stdev(id);
      if (isNaN(stdev)) {
        return new PineArrayObject(
          id.array.map(() => NaN),
          PineArrayType.int,
          context
        );
      }
      if (stdev === 0) {
        return new PineArrayObject(
          id.array.map(() => 1),
          PineArrayType.int,
          context
        );
      }
      return new PineArrayObject(
        id.array.map((x) => (x - mean) / stdev),
        PineArrayType.int,
        context
      );
    };
  }

  function stdev$1(context) {
    return (id, biased = true) => {
      const array = id.array;
      const n_total = array.length;
      if (n_total === 0) return NaN;
      let sum = 0;
      let sumSq = 0;
      let count = 0;
      for (let i = 0; i < n_total; i++) {
        const val = Number(array[i]);
        if (!isNaN(val) && val !== null && val !== void 0) {
          sum += val;
          sumSq += val * val;
          count++;
        }
      }
      if (count === 0) return NaN;
      const mean = sum / count;
      const meanSq = sumSq / count;
      let variance = meanSq - mean * mean;
      if (variance < 0) return NaN;
      if (!biased && count > 1) {
        variance = variance * count / (count - 1);
      }
      if (!biased && count === 1) return 0;
      return context.precision(Math.sqrt(variance));
    };
  }

  function sum$2(context) {
    return (id) => {
      return context.precision(
        id.array.reduce((a, b) => {
          const val = Number(b);
          return isNaN(val) ? a : a + val;
        }, 0)
      );
    };
  }

  function unshift(context) {
    return (id, value) => {
      if (!isValueOfType(value, id.type)) {
        throw new Error(
          `Cannot call 'array.unshift' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${id.type}' is expected.`
        );
      }
      id.array.unshift(context.precision(value));
    };
  }

  function variance$1(context) {
    return (id, biased = true) => {
      let sum = 0;
      let count = 0;
      for (const item of id.array) {
        const val = Number(item);
        if (!isNaN(val) && val !== null && val !== void 0) {
          sum += val;
          count++;
        }
      }
      if (count === 0) return NaN;
      const mean = sum / count;
      let sumSqDiff = 0;
      for (const item of id.array) {
        const val = Number(item);
        if (!isNaN(val) && val !== null && val !== void 0) {
          sumSqDiff += (val - mean) * (val - mean);
        }
      }
      const divisor = biased ? count : count - 1;
      if (divisor <= 0) return NaN;
      return context.precision(sumSqDiff / divisor);
    };
  }

  var __defProp$t = Object.defineProperty;
  var __defNormalProp$t = (obj, key, value) => key in obj ? __defProp$t(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$t = (obj, key, value) => __defNormalProp$t(obj, typeof key !== "symbol" ? key + "" : key, value);
  var PineArrayType = /* @__PURE__ */ ((PineArrayType2) => {
    PineArrayType2["any"] = "";
    PineArrayType2["box"] = "box";
    PineArrayType2["bool"] = "bool";
    PineArrayType2["color"] = "color";
    PineArrayType2["float"] = "float";
    PineArrayType2["int"] = "int";
    PineArrayType2["label"] = "label";
    PineArrayType2["line"] = "line";
    PineArrayType2["linefill"] = "linefill";
    PineArrayType2["string"] = "string";
    PineArrayType2["table"] = "table";
    return PineArrayType2;
  })(PineArrayType || {});
  class PineArrayObject {
    constructor(array, type, context) {
      this.array = array;
      this.type = type;
      this.context = context;
      __publicField$t(this, "_abs");
      __publicField$t(this, "_avg");
      __publicField$t(this, "_binary_search");
      __publicField$t(this, "_binary_search_leftmost");
      __publicField$t(this, "_binary_search_rightmost");
      __publicField$t(this, "_clear");
      __publicField$t(this, "_concat");
      __publicField$t(this, "_copy");
      __publicField$t(this, "_covariance");
      __publicField$t(this, "_every");
      __publicField$t(this, "_fill");
      __publicField$t(this, "_first");
      __publicField$t(this, "_get");
      __publicField$t(this, "_includes");
      __publicField$t(this, "_indexof");
      __publicField$t(this, "_insert");
      __publicField$t(this, "_join");
      __publicField$t(this, "_last");
      __publicField$t(this, "_lastindexof");
      __publicField$t(this, "_max");
      __publicField$t(this, "_median");
      __publicField$t(this, "_min");
      __publicField$t(this, "_mode");
      __publicField$t(this, "_percentile_linear_interpolation");
      __publicField$t(this, "_percentile_nearest_rank");
      __publicField$t(this, "_percentrank");
      __publicField$t(this, "_pop");
      __publicField$t(this, "_push");
      __publicField$t(this, "_range");
      __publicField$t(this, "_remove");
      __publicField$t(this, "_reverse");
      __publicField$t(this, "_set");
      __publicField$t(this, "_shift");
      __publicField$t(this, "_size");
      __publicField$t(this, "_slice");
      __publicField$t(this, "_some");
      __publicField$t(this, "_sort");
      __publicField$t(this, "_sort_indices");
      __publicField$t(this, "_standardize");
      __publicField$t(this, "_stdev");
      __publicField$t(this, "_sum");
      __publicField$t(this, "_unshift");
      __publicField$t(this, "_variance");
      this._abs = abs$1(this.context);
      this._avg = avg$2(this.context);
      this._binary_search = binary_search(this.context);
      this._binary_search_leftmost = binary_search_leftmost(this.context);
      this._binary_search_rightmost = binary_search_rightmost(this.context);
      this._clear = clear$1(this.context);
      this._concat = concat$1(this.context);
      this._copy = copy$2(this.context);
      this._covariance = covariance(this.context);
      this._every = every(this.context);
      this._fill = fill$1(this.context);
      this._first = first(this.context);
      this._get = get$2(this.context);
      this._includes = includes(this.context);
      this._indexof = indexof(this.context);
      this._insert = insert(this.context);
      this._join = join(this.context);
      this._last = last(this.context);
      this._lastindexof = lastindexof(this.context);
      this._max = max$2(this.context);
      this._median = median$2(this.context);
      this._min = min$2(this.context);
      this._mode = mode$2(this.context);
      this._percentile_linear_interpolation = percentile_linear_interpolation$1(this.context);
      this._percentile_nearest_rank = percentile_nearest_rank$1(this.context);
      this._percentrank = percentrank$1(this.context);
      this._pop = pop(this.context);
      this._push = push(this.context);
      this._range = range$1(this.context);
      this._remove = remove$1(this.context);
      this._reverse = reverse$1(this.context);
      this._set = set$1(this.context);
      this._shift = shift(this.context);
      this._size = size$2(this.context);
      this._slice = slice(this.context);
      this._some = some(this.context);
      this._sort = sort$1(this.context);
      this._sort_indices = sort_indices(this.context);
      this._standardize = standardize(this.context);
      this._stdev = stdev$1(this.context);
      this._sum = sum$2(this.context);
      this._unshift = unshift(this.context);
      this._variance = variance$1(this.context);
    }
    toString() {
      return "[" + this.array.toString().replace(/,/g, ", ") + "]";
    }
    abs(...args) {
      return this._abs(this, ...args);
    }
    avg(...args) {
      return this._avg(this, ...args);
    }
    binary_search(...args) {
      return this._binary_search(this, ...args);
    }
    binary_search_leftmost(...args) {
      return this._binary_search_leftmost(this, ...args);
    }
    binary_search_rightmost(...args) {
      return this._binary_search_rightmost(this, ...args);
    }
    clear(...args) {
      return this._clear(this, ...args);
    }
    concat(...args) {
      return this._concat(this, ...args);
    }
    copy(...args) {
      return this._copy(this, ...args);
    }
    covariance(...args) {
      return this._covariance(this, ...args);
    }
    every(...args) {
      return this._every(this, ...args);
    }
    fill(...args) {
      return this._fill(this, ...args);
    }
    first(...args) {
      return this._first(this, ...args);
    }
    get(...args) {
      return this._get(this, ...args);
    }
    includes(...args) {
      return this._includes(this, ...args);
    }
    indexof(...args) {
      return this._indexof(this, ...args);
    }
    insert(...args) {
      return this._insert(this, ...args);
    }
    join(...args) {
      return this._join(this, ...args);
    }
    last(...args) {
      return this._last(this, ...args);
    }
    lastindexof(...args) {
      return this._lastindexof(this, ...args);
    }
    max(...args) {
      return this._max(this, ...args);
    }
    median(...args) {
      return this._median(this, ...args);
    }
    min(...args) {
      return this._min(this, ...args);
    }
    mode(...args) {
      return this._mode(this, ...args);
    }
    percentile_linear_interpolation(...args) {
      return this._percentile_linear_interpolation(this, ...args);
    }
    percentile_nearest_rank(...args) {
      return this._percentile_nearest_rank(this, ...args);
    }
    percentrank(...args) {
      return this._percentrank(this, ...args);
    }
    pop(...args) {
      return this._pop(this, ...args);
    }
    push(...args) {
      return this._push(this, ...args);
    }
    range(...args) {
      return this._range(this, ...args);
    }
    remove(...args) {
      return this._remove(this, ...args);
    }
    reverse(...args) {
      return this._reverse(this, ...args);
    }
    set(...args) {
      return this._set(this, ...args);
    }
    shift(...args) {
      return this._shift(this, ...args);
    }
    size(...args) {
      return this._size(this, ...args);
    }
    slice(...args) {
      return this._slice(this, ...args);
    }
    some(...args) {
      return this._some(this, ...args);
    }
    sort(...args) {
      return this._sort(this, ...args);
    }
    sort_indices(...args) {
      return this._sort_indices(this, ...args);
    }
    standardize(...args) {
      return this._standardize(this, ...args);
    }
    stdev(...args) {
      return this._stdev(this, ...args);
    }
    sum(...args) {
      return this._sum(this, ...args);
    }
    unshift(...args) {
      return this._unshift(this, ...args);
    }
    variance(...args) {
      return this._variance(this, ...args);
    }
  }

  function from(context) {
    return (...values) => {
      return new PineArrayObject([...values], inferArrayType(values), context);
    };
  }

  function new_fn$2(context) {
    return (size, initial_value) => {
      return new PineArrayObject(
        Array(size).fill(context.precision(initial_value || 0)),
        inferValueType(initial_value || 0),
        context
      );
    };
  }

  function new_bool(context) {
    return (size, initial_value = false) => {
      return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.bool, context);
    };
  }

  function new_box(context) {
    return (size = 0, initial_value = NaN) => {
      return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.box, context);
    };
  }

  function new_color(context) {
    return (size = 0, initial_value = "") => {
      return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.color, context);
    };
  }

  function new_float(context) {
    return (size, initial_value = NaN) => {
      return new PineArrayObject(Array(size).fill(context.precision(initial_value)), PineArrayType.float, context);
    };
  }

  function new_int(context) {
    return (size, initial_value = 0) => {
      return new PineArrayObject(Array(size).fill(context.precision(initial_value)), PineArrayType.int, context);
    };
  }

  function new_label(context) {
    return (size = 0, initial_value = NaN) => {
      return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.label, context);
    };
  }

  function new_line(context) {
    return (size = 0, initial_value = NaN) => {
      return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.line, context);
    };
  }

  function new_linefill(context) {
    return (size = 0, initial_value = NaN) => {
      return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.linefill, context);
    };
  }

  function new_string(context) {
    return (size, initial_value = "") => {
      return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.string, context);
    };
  }

  function new_table(context) {
    return (size = 0, initial_value = NaN) => {
      return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.table, context);
    };
  }

  class Series {
    constructor(data, offset = 0) {
      this.data = data;
      this.offset = offset;
    }
    get(index) {
      const realIndex = this.data.length - 1 - (this.offset + index);
      if (realIndex < 0 || realIndex >= this.data.length) {
        return NaN;
      }
      return this.data[realIndex];
    }
    set(index, value) {
      const realIndex = this.data.length - 1 - (this.offset + index);
      if (realIndex >= 0 && realIndex < this.data.length) {
        this.data[realIndex] = value;
      }
    }
    get length() {
      return this.data.length;
    }
    toArray() {
      return this.data;
    }
    static from(source) {
      if (source instanceof Series) return source;
      if (Array.isArray(source)) return new Series(source);
      return new Series([source]);
    }
  }

  function param$7(context) {
    return (source, index = 0) => {
      return Series.from(source).get(index);
    };
  }

  class PineArray {
    constructor(context) {
      this.context = context;
      this.abs = (id, ...args) => id.abs(...args);
      this.avg = (id, ...args) => id.avg(...args);
      this.binary_search = (id, ...args) => id.binary_search(...args);
      this.binary_search_leftmost = (id, ...args) => id.binary_search_leftmost(...args);
      this.binary_search_rightmost = (id, ...args) => id.binary_search_rightmost(...args);
      this.clear = (id, ...args) => id.clear(...args);
      this.concat = (id, ...args) => id.concat(...args);
      this.copy = (id, ...args) => id.copy(...args);
      this.covariance = (id, ...args) => id.covariance(...args);
      this.every = (id, ...args) => id.every(...args);
      this.fill = (id, ...args) => id.fill(...args);
      this.first = (id, ...args) => id.first(...args);
      this.from = from(context);
      this.get = (id, ...args) => id.get(...args);
      this.includes = (id, ...args) => id.includes(...args);
      this.indexof = (id, ...args) => id.indexof(...args);
      this.insert = (id, ...args) => id.insert(...args);
      this.join = (id, ...args) => id.join(...args);
      this.last = (id, ...args) => id.last(...args);
      this.lastindexof = (id, ...args) => id.lastindexof(...args);
      this.max = (id, ...args) => id.max(...args);
      this.median = (id, ...args) => id.median(...args);
      this.min = (id, ...args) => id.min(...args);
      this.mode = (id, ...args) => id.mode(...args);
      this.new = new_fn$2(context);
      this.new_bool = new_bool(context);
      this.new_box = new_box(context);
      this.new_color = new_color(context);
      this.new_float = new_float(context);
      this.new_int = new_int(context);
      this.new_label = new_label(context);
      this.new_line = new_line(context);
      this.new_linefill = new_linefill(context);
      this.new_string = new_string(context);
      this.new_table = new_table(context);
      this.param = param$7();
      this.percentile_linear_interpolation = (id, ...args) => id.percentile_linear_interpolation(...args);
      this.percentile_nearest_rank = (id, ...args) => id.percentile_nearest_rank(...args);
      this.percentrank = (id, ...args) => id.percentrank(...args);
      this.pop = (id, ...args) => id.pop(...args);
      this.push = (id, ...args) => id.push(...args);
      this.range = (id, ...args) => id.range(...args);
      this.remove = (id, ...args) => id.remove(...args);
      this.reverse = (id, ...args) => id.reverse(...args);
      this.set = (id, ...args) => id.set(...args);
      this.shift = (id, ...args) => id.shift(...args);
      this.size = (id, ...args) => id.size(...args);
      this.slice = (id, ...args) => id.slice(...args);
      this.some = (id, ...args) => id.some(...args);
      this.sort = (id, ...args) => id.sort(...args);
      this.sort_indices = (id, ...args) => id.sort_indices(...args);
      this.standardize = (id, ...args) => id.standardize(...args);
      this.stdev = (id, ...args) => id.stdev(...args);
      this.sum = (id, ...args) => id.sum(...args);
      this.unshift = (id, ...args) => id.unshift(...args);
      this.variance = (id, ...args) => id.variance(...args);
    }
  }

  function clear(context) {
    return (id) => {
      id.map.clear();
    };
  }

  function contains(context) {
    return (id, key) => {
      return id.map.has(key);
    };
  }

  function copy$1(context) {
    return (id) => {
      const newMap = new PineMapObject(context);
      newMap.map = new Map(id.map);
      return newMap;
    };
  }

  function get$1(context) {
    return (id, key) => {
      const val = id.map.get(key);
      return val === void 0 ? NaN : val;
    };
  }

  function keys(context) {
    return (id) => {
      const keysArray = Array.from(id.map.keys());
      const keyType = inferValueType(keysArray[0]);
      return new PineArrayObject(keysArray, keyType, context);
    };
  }

  function put(context) {
    return (id, key, value) => {
      const prev = id.map.get(key);
      id.map.set(key, value);
      return prev === void 0 ? NaN : prev;
    };
  }

  function put_all(context) {
    return (id, id2) => {
      for (const [key, value] of id2.map) {
        id.map.set(key, value);
      }
    };
  }

  function remove(context) {
    return (id, key) => {
      const val = id.map.get(key);
      const existed = id.map.delete(key);
      return existed ? val : NaN;
    };
  }

  function size(context) {
    return (id) => {
      return id.map.size;
    };
  }

  function values(context) {
    return (id) => {
      const valuesArray = Array.from(id.map.values());
      const valueType = inferValueType(valuesArray[0]);
      return new PineArrayObject(valuesArray, valueType, context);
    };
  }

  var __defProp$s = Object.defineProperty;
  var __defNormalProp$s = (obj, key, value) => key in obj ? __defProp$s(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$s = (obj, key, value) => __defNormalProp$s(obj, typeof key !== "symbol" ? key + "" : key, value);
  class PineMapObject {
    constructor(context) {
      this.context = context;
      __publicField$s(this, "map");
      __publicField$s(this, "_clear");
      __publicField$s(this, "_contains");
      __publicField$s(this, "_copy");
      __publicField$s(this, "_get");
      __publicField$s(this, "_keys");
      __publicField$s(this, "_put");
      __publicField$s(this, "_put_all");
      __publicField$s(this, "_remove");
      __publicField$s(this, "_size");
      __publicField$s(this, "_values");
      this.map = /* @__PURE__ */ new Map();
      this._clear = clear(this.context);
      this._contains = contains(this.context);
      this._copy = copy$1(this.context);
      this._get = get$1(this.context);
      this._keys = keys(this.context);
      this._put = put(this.context);
      this._put_all = put_all(this.context);
      this._remove = remove(this.context);
      this._size = size(this.context);
      this._values = values(this.context);
    }
    toString() {
      return `PineMapObject(${this.map.size})`;
    }
    clear(...args) {
      return this._clear(this, ...args);
    }
    contains(...args) {
      return this._contains(this, ...args);
    }
    copy(...args) {
      return this._copy(this, ...args);
    }
    get(...args) {
      return this._get(this, ...args);
    }
    keys(...args) {
      return this._keys(this, ...args);
    }
    put(...args) {
      return this._put(this, ...args);
    }
    put_all(...args) {
      return this._put_all(this, ...args);
    }
    remove(...args) {
      return this._remove(this, ...args);
    }
    size(...args) {
      return this._size(this, ...args);
    }
    values(...args) {
      return this._values(this, ...args);
    }
  }

  function new_fn$1(context) {
    return () => {
      return new PineMapObject(context);
    };
  }

  function param$6(context) {
    return (source, index = 0) => {
      return Series.from(source).get(index);
    };
  }

  class PineMap {
    constructor(context) {
      this.context = context;
      this.clear = (id, ...args) => id.clear(...args);
      this.contains = (id, ...args) => id.contains(...args);
      this.copy = (id, ...args) => id.copy(...args);
      this.get = (id, ...args) => id.get(...args);
      this.keys = (id, ...args) => id.keys(...args);
      this.new = new_fn$1(context);
      this.param = param$6();
      this.put = (id, ...args) => id.put(...args);
      this.put_all = (id, ...args) => id.put_all(...args);
      this.remove = (id, ...args) => id.remove(...args);
      this.size = (id, ...args) => id.size(...args);
      this.values = (id, ...args) => id.values(...args);
    }
  }

  function add_col(context) {
    return (id, column_index, values) => {
      const rows = id.matrix.length;
      let colValues = [];
      if (values) {
        if (values instanceof PineArrayObject) {
          colValues = values.array;
        } else if (Array.isArray(values)) {
          colValues = values;
        } else {
          colValues = [values];
        }
      }
      if (rows === 0) {
        for (let i = 0; i < colValues.length; i++) {
          let val = colValues[i];
          if (val instanceof Series) val = val.get(0);
          id.matrix.push([val]);
        }
        return;
      }
      const cols = id.matrix[0].length;
      const index = column_index !== void 0 ? column_index : cols;
      for (let i = 0; i < rows; i++) {
        let val = i < colValues.length ? colValues[i] : NaN;
        if (val instanceof Series) val = val.get(0);
        id.matrix[i].splice(index, 0, val);
      }
    };
  }

  function add_row(context) {
    return (id, row_index, values) => {
      const rows = id.matrix.length;
      let rowValues = [];
      if (values) {
        if (values instanceof PineArrayObject) {
          rowValues = values.array;
        } else if (Array.isArray(values)) {
          rowValues = values;
        } else {
          if (values instanceof Series) {
            const val = values.get(0);
            if (Array.isArray(val)) {
              rowValues = val;
            } else {
              rowValues = [val];
            }
          } else {
            rowValues = [values];
          }
        }
      }
      const cols = rows > 0 ? id.matrix[0].length : rowValues.length;
      const index = row_index !== void 0 ? row_index : rows;
      const newRow = [];
      for (let i = 0; i < cols; i++) {
        if (i < rowValues.length) {
          let val = rowValues[i];
          if (val instanceof Series) {
            val = val.get(0);
          }
          newRow.push(val);
        } else {
          newRow.push(NaN);
        }
      }
      id.matrix.splice(index, 0, newRow);
    };
  }

  function avg$1(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return NaN;
      const cols = id.matrix[0].length;
      if (cols === 0) return NaN;
      let sum = 0;
      let count = 0;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const val = id.matrix[i][j];
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        }
      }
      if (count === 0) return NaN;
      return sum / count;
    };
  }

  function col(context) {
    return (id, column) => {
      const rows = id.matrix.length;
      const result = [];
      for (let i = 0; i < rows; i++) {
        result.push(id.matrix[i][column]);
      }
      const columnType = inferValueType(result[0]);
      return new PineArrayObject(result, columnType, context);
    };
  }

  function columns(context) {
    return (id) => {
      if (id.matrix.length === 0) return 0;
      return id.matrix[0].length;
    };
  }

  function concat(context) {
    return (id, id2) => {
      const rows1 = id.matrix.length;
      const rows2 = id2.matrix.length;
      if (rows1 === 0) {
        for (let i = 0; i < rows2; i++) {
          id.matrix.push([...id2.matrix[i]]);
        }
        return;
      }
      const cols1 = id.matrix[0].length;
      const cols2 = rows2 > 0 ? id2.matrix[0].length : 0;
      if (cols1 !== cols2 && rows2 > 0) {
        console.error(`matrix.concat: Column count mismatch ${cols1} vs ${cols2}`);
        return;
      }
      for (let i = 0; i < rows2; i++) {
        id.matrix.push([...id2.matrix[i]]);
      }
    };
  }

  function copy(context) {
    return (id) => {
      const rows = id.matrix.length;
      const cols = rows > 0 ? id.matrix[0].length : 0;
      const newMatrix = new PineMatrixObject(rows, cols, NaN, context);
      newMatrix.matrix = id.matrix.map((row) => [...row]);
      return newMatrix;
    };
  }

  function determinant(matrix) {
    const n = matrix.length;
    if (n === 0) return 0;
    if (n === 1) return matrix[0][0];
    if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    const mat = matrix.map((row) => [...row]);
    let det2 = 1;
    for (let i = 0; i < n; i++) {
      let pivot = i;
      while (pivot < n && mat[pivot][i] === 0) pivot++;
      if (pivot === n) return 0;
      if (pivot !== i) {
        [mat[i], mat[pivot]] = [mat[pivot], mat[i]];
        det2 *= -1;
      }
      det2 *= mat[i][i];
      for (let j = i + 1; j < n; j++) {
        const factor = mat[j][i] / mat[i][i];
        for (let k = i; k < n; k++) {
          mat[j][k] -= factor * mat[i][k];
        }
      }
    }
    return det2;
  }
  function det(context) {
    return (id) => {
      const rows = id.matrix.length;
      const cols = rows > 0 ? id.matrix[0].length : 0;
      if (rows !== cols) return NaN;
      return determinant(id.matrix);
    };
  }

  function diff(context) {
    return (id, id2) => {
      const rows = id.matrix.length;
      if (rows === 0) return new PineMatrixObject(0, 0, NaN, context);
      const cols = id.matrix[0].length;
      const newMatrix = new PineMatrixObject(rows, cols, NaN, context);
      if (id2 instanceof PineMatrixObject) {
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const v1 = id.matrix[i][j];
            const v2 = id2.matrix[i] && id2.matrix[i][j] !== void 0 ? id2.matrix[i][j] : NaN;
            newMatrix.matrix[i][j] = v1 - v2;
          }
        }
      } else {
        const scalar = id2;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            newMatrix.matrix[i][j] = id.matrix[i][j] - scalar;
          }
        }
      }
      return newMatrix;
    };
  }

  function calculateEigenvalues(matrix) {
    const n = matrix.length;
    if (n !== 2) return Array(n).fill(NaN);
    const a = matrix[0][0];
    const b = matrix[0][1];
    const c = matrix[1][0];
    const d = matrix[1][1];
    const trace = a + d;
    const det = a * d - b * c;
    const delta = trace * trace - 4 * det;
    if (delta < 0) return [NaN, NaN];
    const l1 = (trace + Math.sqrt(delta)) / 2;
    const l2 = (trace - Math.sqrt(delta)) / 2;
    return [l1, l2];
  }
  function eigenvalues(context) {
    return (id) => {
      const rows = id.matrix.length;
      const cols = rows > 0 ? id.matrix[0].length : 0;
      if (rows !== cols) {
        const anyType = inferValueType(id.matrix[0][0]);
        return new PineArrayObject([], anyType, context);
      }
      const vals = calculateEigenvalues(id.matrix);
      const valueType = inferValueType(vals[0]);
      return new PineArrayObject(vals, valueType, context);
    };
  }

  function eigenvectors(context) {
    return (id) => {
      const rows = id.matrix.length;
      const cols = rows > 0 ? id.matrix[0].length : 0;
      if (rows !== cols) return new PineMatrixObject(0, 0, NaN, context);
      const newMatrix = new PineMatrixObject(rows, cols, 0, context);
      for (let i = 0; i < rows; i++) newMatrix.matrix[i][i] = 1;
      return newMatrix;
    };
  }

  function elements_count(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return 0;
      return rows * id.matrix[0].length;
    };
  }

  function fill(context) {
    return (id, value, from_row, to_row, from_col, to_col) => {
      const rows = id.matrix.length;
      if (rows === 0) return;
      const cols = id.matrix[0].length;
      const r1 = from_row !== void 0 ? from_row : 0;
      const r2 = to_row !== void 0 ? to_row : rows;
      const c1 = from_col !== void 0 ? from_col : 0;
      const c2 = to_col !== void 0 ? to_col : cols;
      for (let i = r1; i < r2; i++) {
        if (i >= rows) break;
        for (let j = c1; j < c2; j++) {
          if (j >= cols) break;
          id.matrix[i][j] = value;
        }
      }
    };
  }

  function get(context) {
    return (id, row, col) => {
      if (!id.matrix[row]) return NaN;
      const val = id.matrix[row][col];
      return val === void 0 ? NaN : val;
    };
  }

  function inverse(matrix) {
    const n = matrix.length;
    if (n !== 2) return matrix.map((r) => r.map(() => NaN));
    const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    if (det === 0)
      return [
        [NaN, NaN],
        [NaN, NaN]
      ];
    return [
      [matrix[1][1] / det, -matrix[0][1] / det],
      [-matrix[1][0] / det, matrix[0][0] / det]
    ];
  }
  function inv(context) {
    return (id) => {
      const rows = id.matrix.length;
      const cols = rows > 0 ? id.matrix[0].length : 0;
      if (rows !== cols) return new PineMatrixObject(rows, cols, NaN, context);
      const invMat = inverse(id.matrix);
      const newMatrix = new PineMatrixObject(rows, cols, NaN, context);
      newMatrix.matrix = invMat;
      return newMatrix;
    };
  }

  function is_antidiagonal(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return false;
      const cols = id.matrix[0].length;
      if (rows !== cols) return false;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (i + j !== rows - 1) {
            if (id.matrix[i][j] !== 0) return false;
          }
        }
      }
      return true;
    };
  }

  function is_antisymmetric(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return false;
      const cols = id.matrix[0].length;
      if (rows !== cols) return false;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (id.matrix[j][i] !== -id.matrix[i][j]) return false;
        }
      }
      return true;
    };
  }

  function is_binary(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return false;
      const cols = id.matrix[0].length;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const val = id.matrix[i][j];
          if (val !== 0 && val !== 1) return false;
        }
      }
      return true;
    };
  }

  function is_diagonal(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return false;
      const cols = id.matrix[0].length;
      if (rows !== cols) return false;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (i !== j) {
            if (id.matrix[i][j] !== 0) return false;
          }
        }
      }
      return true;
    };
  }

  function is_identity(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return false;
      const cols = id.matrix[0].length;
      if (rows !== cols) return false;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (i === j) {
            if (id.matrix[i][j] !== 1) return false;
          } else {
            if (id.matrix[i][j] !== 0) return false;
          }
        }
      }
      return true;
    };
  }

  function is_square(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return false;
      const cols = id.matrix[0].length;
      return rows === cols;
    };
  }

  function is_stochastic(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return false;
      const cols = id.matrix[0].length;
      for (let i = 0; i < rows; i++) {
        let sum = 0;
        for (let j = 0; j < cols; j++) {
          const val = id.matrix[i][j];
          if (val < 0) return false;
          sum += val;
        }
        if (Math.abs(sum - 1) > 1e-10) return false;
      }
      return true;
    };
  }

  function is_symmetric(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return false;
      const cols = id.matrix[0].length;
      if (rows !== cols) return false;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < i; j++) {
          if (id.matrix[i][j] !== id.matrix[j][i]) return false;
        }
      }
      return true;
    };
  }

  function is_triangular(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return false;
      const cols = id.matrix[0].length;
      if (rows !== cols) return false;
      let isUpper = true;
      let isLower = true;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (i > j && id.matrix[i][j] !== 0) isUpper = false;
          if (i < j && id.matrix[i][j] !== 0) isLower = false;
        }
      }
      return isUpper || isLower;
    };
  }

  function is_zero(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return true;
      const cols = id.matrix[0].length;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (id.matrix[i][j] !== 0) return false;
        }
      }
      return true;
    };
  }

  function kron(context) {
    return (id, id2) => {
      const r1 = id.matrix.length;
      const c1 = r1 > 0 ? id.matrix[0].length : 0;
      const r2 = id2.matrix.length;
      const c2 = r2 > 0 ? id2.matrix[0].length : 0;
      const rows = r1 * r2;
      const cols = c1 * c2;
      const newMatrix = new PineMatrixObject(rows, cols, NaN, context);
      for (let i = 0; i < r1; i++) {
        for (let j = 0; j < c1; j++) {
          const val1 = id.matrix[i][j];
          for (let k = 0; k < r2; k++) {
            for (let l = 0; l < c2; l++) {
              const val2 = id2.matrix[k][l];
              newMatrix.matrix[i * r2 + k][j * c2 + l] = val1 * val2;
            }
          }
        }
      }
      return newMatrix;
    };
  }

  function max$1(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return NaN;
      const cols = id.matrix[0].length;
      let maxVal = -Infinity;
      let found = false;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const val = id.matrix[i][j];
          if (!isNaN(val)) {
            if (val > maxVal) maxVal = val;
            found = true;
          }
        }
      }
      return found ? maxVal : NaN;
    };
  }

  function median$1(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return NaN;
      const cols = id.matrix[0].length;
      const values = [];
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const val = id.matrix[i][j];
          if (!isNaN(val)) {
            values.push(val);
          }
        }
      }
      if (values.length === 0) return NaN;
      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      if (values.length % 2 !== 0) {
        return values[mid];
      } else {
        return (values[mid - 1] + values[mid]) / 2;
      }
    };
  }

  function min$1(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return NaN;
      const cols = id.matrix[0].length;
      let minVal = Infinity;
      let found = false;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const val = id.matrix[i][j];
          if (!isNaN(val)) {
            if (val < minVal) minVal = val;
            found = true;
          }
        }
      }
      return found ? minVal : NaN;
    };
  }

  function mode$1(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return NaN;
      const cols = id.matrix[0].length;
      const counts = /* @__PURE__ */ new Map();
      let maxCount = 0;
      let modeVal = NaN;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const val = id.matrix[i][j];
          if (!isNaN(val)) {
            const count = (counts.get(val) || 0) + 1;
            counts.set(val, count);
            if (count > maxCount) {
              maxCount = count;
              modeVal = val;
            } else if (count === maxCount) {
              if (val < modeVal) modeVal = val;
            }
          }
        }
      }
      return modeVal;
    };
  }

  function mult(context) {
    return (id, id2) => {
      const rows1 = id.matrix.length;
      const cols1 = rows1 > 0 ? id.matrix[0].length : 0;
      if (id2 instanceof PineMatrixObject) {
        const rows2 = id2.matrix.length;
        const cols2 = rows2 > 0 ? id2.matrix[0].length : 0;
        if (cols1 !== rows2) {
          return new PineMatrixObject(0, 0, NaN, context);
        }
        const newMatrix = new PineMatrixObject(rows1, cols2, 0, context);
        for (let i = 0; i < rows1; i++) {
          for (let j = 0; j < cols2; j++) {
            let sum = 0;
            for (let k = 0; k < cols1; k++) {
              sum += id.matrix[i][k] * id2.matrix[k][j];
            }
            newMatrix.matrix[i][j] = sum;
          }
        }
        return newMatrix;
      } else if (id2 instanceof PineArrayObject || Array.isArray(id2.array || id2)) {
        const vec = id2.array || id2;
        if (cols1 !== vec.length) {
          return new PineMatrixObject(0, 0, NaN, context);
        }
        const newMatrix = new PineMatrixObject(rows1, 1, 0, context);
        for (let i = 0; i < rows1; i++) {
          let sum = 0;
          for (let j = 0; j < cols1; j++) {
            sum += id.matrix[i][j] * vec[j];
          }
          newMatrix.matrix[i][0] = sum;
        }
        return newMatrix;
      } else {
        const scalar = id2;
        const newMatrix = new PineMatrixObject(rows1, cols1, NaN, context);
        for (let i = 0; i < rows1; i++) {
          for (let j = 0; j < cols1; j++) {
            newMatrix.matrix[i][j] = id.matrix[i][j] * scalar;
          }
        }
        return newMatrix;
      }
    };
  }

  function pinv(context) {
    return (id) => {
      const rows = id.matrix.length;
      const cols = rows > 0 ? id.matrix[0].length : 0;
      if (rows === cols) {
        return new PineMatrixObject(rows, cols, NaN, context);
      }
      return new PineMatrixObject(cols, rows, NaN, context);
    };
  }

  function pow$1(context) {
    return (id, power) => {
      const rows = id.matrix.length;
      const cols = rows > 0 ? id.matrix[0].length : 0;
      if (rows !== cols) {
        return new PineMatrixObject(0, 0, NaN, context);
      }
      let result = new PineMatrixObject(rows, cols, 0, context);
      for (let i = 0; i < rows; i++) result.matrix[i][i] = 1;
      let base = new PineMatrixObject(rows, cols, NaN, context);
      for (let i = 0; i < rows; i++) base.matrix[i] = [...id.matrix[i]];
      let p = Math.floor(power);
      if (p < 0) return new PineMatrixObject(rows, cols, NaN, context);
      while (p > 0) {
        if (p % 2 === 1) {
          const temp = new PineMatrixObject(rows, cols, 0, context);
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
              let sum = 0;
              for (let k = 0; k < rows; k++) {
                sum += result.matrix[i][k] * base.matrix[k][j];
              }
              temp.matrix[i][j] = sum;
            }
          }
          result = temp;
        }
        const tempBase = new PineMatrixObject(rows, cols, 0, context);
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            let sum = 0;
            for (let k = 0; k < rows; k++) {
              sum += base.matrix[i][k] * base.matrix[k][j];
            }
            tempBase.matrix[i][j] = sum;
          }
        }
        base = tempBase;
        p = Math.floor(p / 2);
      }
      return result;
    };
  }

  function rank(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return 0;
      const cols = id.matrix[0].length;
      const mat = id.matrix.map((r2) => [...r2]);
      let r = 0;
      for (let c = 0; c < cols && r < rows; c++) {
        let pivot = r;
        while (pivot < rows && Math.abs(mat[pivot][c]) < 1e-10) pivot++;
        if (pivot < rows) {
          [mat[r], mat[pivot]] = [mat[pivot], mat[r]];
          const val = mat[r][c];
          for (let j = c; j < cols; j++) mat[r][j] /= val;
          for (let i = 0; i < rows; i++) {
            if (i !== r) {
              const factor = mat[i][c];
              for (let j = c; j < cols; j++) mat[i][j] -= factor * mat[r][j];
            }
          }
          r++;
        }
      }
      return r;
    };
  }

  function remove_col(context) {
    return (id, column_index) => {
      const rows = id.matrix.length;
      if (rows === 0) {
        const anyType = inferValueType(id.matrix[0][0]);
        return new PineArrayObject([], anyType, context);
      }
      const removedValues = [];
      for (let i = 0; i < rows; i++) {
        const removed = id.matrix[i].splice(column_index, 1);
        removedValues.push(removed[0]);
      }
      const removedValueType = inferValueType(removedValues[0]);
      return new PineArrayObject(removedValues, removedValueType, context);
    };
  }

  function remove_row(context) {
    return (id, row_index) => {
      const removed = id.matrix.splice(row_index, 1);
      const removedValueType = inferValueType(removed[0][0]);
      return new PineArrayObject(removed[0] || [], removedValueType, context);
    };
  }

  function reshape(context) {
    return (id, rows, cols) => {
      const currentRows = id.matrix.length;
      const currentCols = currentRows > 0 ? id.matrix[0].length : 0;
      const newSize = rows * cols;
      const elements = [];
      for (let i = 0; i < currentRows; i++) {
        for (let j = 0; j < currentCols; j++) {
          elements.push(id.matrix[i][j]);
        }
      }
      while (elements.length < newSize) elements.push(NaN);
      if (elements.length > newSize) elements.length = newSize;
      const newMatrix = [];
      let k = 0;
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          row.push(elements[k++]);
        }
        newMatrix.push(row);
      }
      id.matrix = newMatrix;
    };
  }

  function reverse(context) {
    return (id) => {
      id.matrix.reverse();
      for (const row of id.matrix) {
        row.reverse();
      }
    };
  }

  function row(context) {
    return (id, row2) => {
      if (!id.matrix[row2]) {
        const anyType = inferValueType(id.matrix[0][0]);
        return new PineArrayObject([], anyType, context);
      }
      const rowType = inferValueType(id.matrix[row2][0]);
      return new PineArrayObject([...id.matrix[row2]], rowType, context);
    };
  }

  function rows(context) {
    return (id) => {
      return id.matrix.length;
    };
  }

  function set(context) {
    return (id, row, col, value) => {
      if (!id.matrix[row]) return;
      id.matrix[row][col] = value;
    };
  }

  function sort(context) {
    return (id, column = 0, order = "asc") => {
      const rows = id.matrix.length;
      if (rows === 0) return;
      id.matrix.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA < valB) return order === "asc" ? -1 : 1;
        if (valA > valB) return order === "asc" ? 1 : -1;
        return 0;
      });
    };
  }

  function submatrix(context) {
    return (id, from_row, to_row, from_col, to_col) => {
      const rows = to_row - from_row;
      const cols = to_col - from_col;
      const newMatrix = new PineMatrixObject(rows, cols, NaN, context);
      for (let i = 0; i < rows; i++) {
        const sourceRow = from_row + i;
        if (sourceRow >= id.matrix.length) break;
        for (let j = 0; j < cols; j++) {
          const sourceCol = from_col + j;
          if (sourceCol >= id.matrix[sourceRow].length) break;
          newMatrix.matrix[i][j] = id.matrix[sourceRow][sourceCol];
        }
      }
      return newMatrix;
    };
  }

  function sum$1(context) {
    return (id, id2) => {
      const rows = id.matrix.length;
      if (rows === 0) return new PineMatrixObject(0, 0, NaN, context);
      const cols = id.matrix[0].length;
      const newMatrix = new PineMatrixObject(rows, cols, NaN, context);
      if (id2 instanceof PineMatrixObject) {
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const v1 = id.matrix[i][j];
            const v2 = id2.matrix[i] && id2.matrix[i][j] !== void 0 ? id2.matrix[i][j] : NaN;
            newMatrix.matrix[i][j] = v1 + v2;
          }
        }
      } else {
        const scalar = id2;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            newMatrix.matrix[i][j] = id.matrix[i][j] + scalar;
          }
        }
      }
      return newMatrix;
    };
  }

  function swap_columns(context) {
    return (id, col1, col2) => {
      const rows = id.matrix.length;
      for (let i = 0; i < rows; i++) {
        const temp = id.matrix[i][col1];
        id.matrix[i][col1] = id.matrix[i][col2];
        id.matrix[i][col2] = temp;
      }
    };
  }

  function swap_rows(context) {
    return (id, row1, row2) => {
      const temp = id.matrix[row1];
      id.matrix[row1] = id.matrix[row2];
      id.matrix[row2] = temp;
    };
  }

  function trace(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return 0;
      const cols = id.matrix[0].length;
      const n = Math.min(rows, cols);
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += id.matrix[i][i];
      }
      return sum;
    };
  }

  function transpose(context) {
    return (id) => {
      const rows = id.matrix.length;
      if (rows === 0) return new PineMatrixObject(0, 0, NaN, context);
      const cols = id.matrix[0].length;
      const newMatrix = new PineMatrixObject(cols, rows, NaN, context);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          newMatrix.matrix[j][i] = id.matrix[i][j];
        }
      }
      return newMatrix;
    };
  }

  var __defProp$r = Object.defineProperty;
  var __defNormalProp$r = (obj, key, value) => key in obj ? __defProp$r(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$r = (obj, key, value) => __defNormalProp$r(obj, typeof key !== "symbol" ? key + "" : key, value);
  class PineMatrixObject {
    constructor(rows$1 = 0, cols = 0, initialValue = NaN, context) {
      this.context = context;
      __publicField$r(this, "matrix");
      __publicField$r(this, "_add_col");
      __publicField$r(this, "_add_row");
      __publicField$r(this, "_avg");
      __publicField$r(this, "_col");
      __publicField$r(this, "_columns");
      __publicField$r(this, "_concat");
      __publicField$r(this, "_copy");
      __publicField$r(this, "_det");
      __publicField$r(this, "_diff");
      __publicField$r(this, "_eigenvalues");
      __publicField$r(this, "_eigenvectors");
      __publicField$r(this, "_elements_count");
      __publicField$r(this, "_fill");
      __publicField$r(this, "_get");
      __publicField$r(this, "_inv");
      __publicField$r(this, "_is_antidiagonal");
      __publicField$r(this, "_is_antisymmetric");
      __publicField$r(this, "_is_binary");
      __publicField$r(this, "_is_diagonal");
      __publicField$r(this, "_is_identity");
      __publicField$r(this, "_is_square");
      __publicField$r(this, "_is_stochastic");
      __publicField$r(this, "_is_symmetric");
      __publicField$r(this, "_is_triangular");
      __publicField$r(this, "_is_zero");
      __publicField$r(this, "_kron");
      __publicField$r(this, "_max");
      __publicField$r(this, "_median");
      __publicField$r(this, "_min");
      __publicField$r(this, "_mode");
      __publicField$r(this, "_mult");
      __publicField$r(this, "_pinv");
      __publicField$r(this, "_pow");
      __publicField$r(this, "_rank");
      __publicField$r(this, "_remove_col");
      __publicField$r(this, "_remove_row");
      __publicField$r(this, "_reshape");
      __publicField$r(this, "_reverse");
      __publicField$r(this, "_row");
      __publicField$r(this, "_rows");
      __publicField$r(this, "_set");
      __publicField$r(this, "_sort");
      __publicField$r(this, "_submatrix");
      __publicField$r(this, "_sum");
      __publicField$r(this, "_swap_columns");
      __publicField$r(this, "_swap_rows");
      __publicField$r(this, "_trace");
      __publicField$r(this, "_transpose");
      this.matrix = [];
      if (rows$1 > 0 && cols > 0) {
        for (let i = 0; i < rows$1; i++) {
          this.matrix.push(Array(cols).fill(initialValue));
        }
      }
      this._add_col = add_col(this.context);
      this._add_row = add_row(this.context);
      this._avg = avg$1(this.context);
      this._col = col(this.context);
      this._columns = columns(this.context);
      this._concat = concat(this.context);
      this._copy = copy(this.context);
      this._det = det(this.context);
      this._diff = diff(this.context);
      this._eigenvalues = eigenvalues(this.context);
      this._eigenvectors = eigenvectors(this.context);
      this._elements_count = elements_count(this.context);
      this._fill = fill(this.context);
      this._get = get(this.context);
      this._inv = inv(this.context);
      this._is_antidiagonal = is_antidiagonal(this.context);
      this._is_antisymmetric = is_antisymmetric(this.context);
      this._is_binary = is_binary(this.context);
      this._is_diagonal = is_diagonal(this.context);
      this._is_identity = is_identity(this.context);
      this._is_square = is_square(this.context);
      this._is_stochastic = is_stochastic(this.context);
      this._is_symmetric = is_symmetric(this.context);
      this._is_triangular = is_triangular(this.context);
      this._is_zero = is_zero(this.context);
      this._kron = kron(this.context);
      this._max = max$1(this.context);
      this._median = median$1(this.context);
      this._min = min$1(this.context);
      this._mode = mode$1(this.context);
      this._mult = mult(this.context);
      this._pinv = pinv(this.context);
      this._pow = pow$1(this.context);
      this._rank = rank(this.context);
      this._remove_col = remove_col(this.context);
      this._remove_row = remove_row(this.context);
      this._reshape = reshape(this.context);
      this._reverse = reverse(this.context);
      this._row = row(this.context);
      this._rows = rows(this.context);
      this._set = set(this.context);
      this._sort = sort(this.context);
      this._submatrix = submatrix(this.context);
      this._sum = sum$1(this.context);
      this._swap_columns = swap_columns(this.context);
      this._swap_rows = swap_rows(this.context);
      this._trace = trace(this.context);
      this._transpose = transpose(this.context);
    }
    toString() {
      let result = "";
      for (let i = 0; i < this.matrix.length; i++) {
        result += result === "" ? "" : "\n";
        result += "[" + this.matrix[i].join(", ") + "]";
      }
      return result;
    }
    add_col(...args) {
      return this._add_col(this, ...args);
    }
    add_row(...args) {
      return this._add_row(this, ...args);
    }
    avg(...args) {
      return this._avg(this, ...args);
    }
    col(...args) {
      return this._col(this, ...args);
    }
    columns(...args) {
      return this._columns(this, ...args);
    }
    concat(...args) {
      return this._concat(this, ...args);
    }
    copy(...args) {
      return this._copy(this, ...args);
    }
    det(...args) {
      return this._det(this, ...args);
    }
    diff(...args) {
      return this._diff(this, ...args);
    }
    eigenvalues(...args) {
      return this._eigenvalues(this, ...args);
    }
    eigenvectors(...args) {
      return this._eigenvectors(this, ...args);
    }
    elements_count(...args) {
      return this._elements_count(this, ...args);
    }
    fill(...args) {
      return this._fill(this, ...args);
    }
    get(...args) {
      return this._get(this, ...args);
    }
    inv(...args) {
      return this._inv(this, ...args);
    }
    is_antidiagonal(...args) {
      return this._is_antidiagonal(this, ...args);
    }
    is_antisymmetric(...args) {
      return this._is_antisymmetric(this, ...args);
    }
    is_binary(...args) {
      return this._is_binary(this, ...args);
    }
    is_diagonal(...args) {
      return this._is_diagonal(this, ...args);
    }
    is_identity(...args) {
      return this._is_identity(this, ...args);
    }
    is_square(...args) {
      return this._is_square(this, ...args);
    }
    is_stochastic(...args) {
      return this._is_stochastic(this, ...args);
    }
    is_symmetric(...args) {
      return this._is_symmetric(this, ...args);
    }
    is_triangular(...args) {
      return this._is_triangular(this, ...args);
    }
    is_zero(...args) {
      return this._is_zero(this, ...args);
    }
    kron(...args) {
      return this._kron(this, ...args);
    }
    max(...args) {
      return this._max(this, ...args);
    }
    median(...args) {
      return this._median(this, ...args);
    }
    min(...args) {
      return this._min(this, ...args);
    }
    mode(...args) {
      return this._mode(this, ...args);
    }
    mult(...args) {
      return this._mult(this, ...args);
    }
    pinv(...args) {
      return this._pinv(this, ...args);
    }
    pow(...args) {
      return this._pow(this, ...args);
    }
    rank(...args) {
      return this._rank(this, ...args);
    }
    remove_col(...args) {
      return this._remove_col(this, ...args);
    }
    remove_row(...args) {
      return this._remove_row(this, ...args);
    }
    reshape(...args) {
      return this._reshape(this, ...args);
    }
    reverse(...args) {
      return this._reverse(this, ...args);
    }
    row(...args) {
      return this._row(this, ...args);
    }
    rows(...args) {
      return this._rows(this, ...args);
    }
    set(...args) {
      return this._set(this, ...args);
    }
    sort(...args) {
      return this._sort(this, ...args);
    }
    submatrix(...args) {
      return this._submatrix(this, ...args);
    }
    sum(...args) {
      return this._sum(this, ...args);
    }
    swap_columns(...args) {
      return this._swap_columns(this, ...args);
    }
    swap_rows(...args) {
      return this._swap_rows(this, ...args);
    }
    trace(...args) {
      return this._trace(this, ...args);
    }
    transpose(...args) {
      return this._transpose(this, ...args);
    }
  }

  function new_fn(context) {
    return (rows, cols, initial_value) => {
      return new PineMatrixObject(rows, cols, initial_value, context);
    };
  }

  function param$5(context) {
    return (source, index = 0) => {
      return Series.from(source).get(index);
    };
  }

  class PineMatrix {
    constructor(context) {
      this.context = context;
      this.add_col = (id, ...args) => id.add_col(...args);
      this.add_row = (id, ...args) => id.add_row(...args);
      this.avg = (id, ...args) => id.avg(...args);
      this.col = (id, ...args) => id.col(...args);
      this.columns = (id, ...args) => id.columns(...args);
      this.concat = (id, ...args) => id.concat(...args);
      this.copy = (id, ...args) => id.copy(...args);
      this.det = (id, ...args) => id.det(...args);
      this.diff = (id, ...args) => id.diff(...args);
      this.eigenvalues = (id, ...args) => id.eigenvalues(...args);
      this.eigenvectors = (id, ...args) => id.eigenvectors(...args);
      this.elements_count = (id, ...args) => id.elements_count(...args);
      this.fill = (id, ...args) => id.fill(...args);
      this.get = (id, ...args) => id.get(...args);
      this.inv = (id, ...args) => id.inv(...args);
      this.is_antidiagonal = (id, ...args) => id.is_antidiagonal(...args);
      this.is_antisymmetric = (id, ...args) => id.is_antisymmetric(...args);
      this.is_binary = (id, ...args) => id.is_binary(...args);
      this.is_diagonal = (id, ...args) => id.is_diagonal(...args);
      this.is_identity = (id, ...args) => id.is_identity(...args);
      this.is_square = (id, ...args) => id.is_square(...args);
      this.is_stochastic = (id, ...args) => id.is_stochastic(...args);
      this.is_symmetric = (id, ...args) => id.is_symmetric(...args);
      this.is_triangular = (id, ...args) => id.is_triangular(...args);
      this.is_zero = (id, ...args) => id.is_zero(...args);
      this.kron = (id, ...args) => id.kron(...args);
      this.max = (id, ...args) => id.max(...args);
      this.median = (id, ...args) => id.median(...args);
      this.min = (id, ...args) => id.min(...args);
      this.mode = (id, ...args) => id.mode(...args);
      this.mult = (id, ...args) => id.mult(...args);
      this.new = new_fn(context);
      this.param = param$5();
      this.pinv = (id, ...args) => id.pinv(...args);
      this.pow = (id, ...args) => id.pow(...args);
      this.rank = (id, ...args) => id.rank(...args);
      this.remove_col = (id, ...args) => id.remove_col(...args);
      this.remove_row = (id, ...args) => id.remove_row(...args);
      this.reshape = (id, ...args) => id.reshape(...args);
      this.reverse = (id, ...args) => id.reverse(...args);
      this.row = (id, ...args) => id.row(...args);
      this.rows = (id, ...args) => id.rows(...args);
      this.set = (id, ...args) => id.set(...args);
      this.sort = (id, ...args) => id.sort(...args);
      this.submatrix = (id, ...args) => id.submatrix(...args);
      this.sum = (id, ...args) => id.sum(...args);
      this.swap_columns = (id, ...args) => id.swap_columns(...args);
      this.swap_rows = (id, ...args) => id.swap_rows(...args);
      this.trace = (id, ...args) => id.trace(...args);
      this.transpose = (id, ...args) => id.transpose(...args);
    }
  }

  function avg_losing_trade(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getAvgLosingTrade();
    };
  }

  function avg_trade(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getAvgTrade();
    };
  }

  function avg_winning_trade(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getAvgWinningTrade();
    };
  }

  function cancel(context) {
    return (id) => {
      const engine = context._strategyEngine;
      if (!engine) {
        console.warn("Strategy not initialized. Call strategy() first.");
        return false;
      }
      return engine.cancelOrder(id);
    };
  }

  function cancel_all(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        console.warn("Strategy not initialized. Call strategy() first.");
        return;
      }
      engine.cancelAllOrders();
    };
  }

  function close(context) {
    return (id, comment, alert_message, immediately, disable_alert) => {
      const engine = context._strategyEngine;
      if (!engine) {
        console.warn("Strategy not initialized. Call strategy() first.");
        return;
      }
      const state = engine.getState();
      if (state.position_size === 0) {
        return;
      }
      const matchingTrades = state.open_trades.filter((t) => t.entry_id === id);
      if (matchingTrades.length === 0) {
        return;
      }
      const qtyToClose = matchingTrades.reduce((sum, t) => sum + t.size, 0);
      const exitDirection = state.position_size > 0 ? "short" : "long";
      if (immediately) {
        const currentPrice = context.data.close instanceof Series ? context.data.close.get(0) : context.data.close;
        const time = context.data.openTime instanceof Series ? context.data.openTime.get(0) : Date.now();
        engine.closePosition(currentPrice, context.idx, time, qtyToClose, `close_${id}`);
      } else {
        engine.addOrder({
          id: `close_${id}`,
          direction: exitDirection,
          qty: qtyToClose,
          comment,
          alert_message,
          isExit: true
          // Mark as exit order to prevent opening new position
        });
      }
    };
  }

  function close_all(context) {
    return (comment, alert_message, immediately, disable_alert) => {
      const engine = context._strategyEngine;
      if (!engine) {
        console.warn("Strategy not initialized. Call strategy() first.");
        return;
      }
      const state = engine.getState();
      if (state.position_size === 0) {
        return;
      }
      if (immediately) {
        engine.closeAllPositions("close_all");
      } else {
        const exitDirection = state.position_size > 0 ? "short" : "long";
        const totalQty = Math.abs(state.position_size);
        engine.addOrder({
          id: "close_all",
          direction: exitDirection,
          qty: totalQty,
          comment,
          alert_message,
          isExit: true
          // Mark as exit order to prevent opening new position
        });
      }
    };
  }

  function closedtrades(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getClosedTradesCount();
    };
  }

  function closedtrades_commission(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      const trades = engine.getClosedTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return 0;
      }
      return trades[trade_num].commission || 0;
    };
  }

  function closedtrades_entry_bar_index(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return NaN;
      }
      const trades = engine.getClosedTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return NaN;
      }
      return trades[trade_num].entry_bar_index;
    };
  }

  function closedtrades_entry_price(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return NaN;
      }
      const trades = engine.getClosedTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return NaN;
      }
      return trades[trade_num].entry_price;
    };
  }

  function closedtrades_exit_bar_index(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return NaN;
      }
      const trades = engine.getClosedTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return NaN;
      }
      return trades[trade_num].exit_bar_index || NaN;
    };
  }

  function closedtrades_exit_price(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return NaN;
      }
      const trades = engine.getClosedTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return NaN;
      }
      return trades[trade_num].exit_price || NaN;
    };
  }

  function closedtrades_max_drawdown(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      const trades = engine.getClosedTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return 0;
      }
      return trades[trade_num].max_drawdown || 0;
    };
  }

  function closedtrades_max_runup(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      const trades = engine.getClosedTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return 0;
      }
      return trades[trade_num].max_runup || 0;
    };
  }

  function closedtrades_profit(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      const trades = engine.getClosedTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return 0;
      }
      return trades[trade_num].profit || 0;
    };
  }

  function closedtrades_size(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      const trades = engine.getClosedTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return 0;
      }
      return trades[trade_num].size;
    };
  }

  function entry(context) {
    return (id, direction, qty, limit, stop, oca_name, oca_type, comment, alert_message, disable_alert) => {
      const engine = context._strategyEngine;
      if (!engine) {
        console.warn("Strategy not initialized. Call strategy() first.");
        return;
      }
      const getVal = (v) => v instanceof Series ? v.get(0) : v;
      const orderQty = qty !== void 0 ? getVal(qty) : engine.getDefaultQty();
      const limitPrice = limit !== void 0 ? getVal(limit) : void 0;
      const stopPrice = stop !== void 0 ? getVal(stop) : void 0;
      engine.addOrder({
        id: id || engine.generateOrderId(),
        direction,
        qty: orderQty,
        limit: limitPrice,
        stop: stopPrice,
        oca_name,
        oca_type,
        comment,
        alert_message
      });
    };
  }

  function equity(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 1e5;
      }
      return engine.getEquity();
    };
  }

  function eventrades(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getEventrades();
    };
  }

  function exit(context) {
    return (id, from_entry, qty, qty_percent, profit, limit, loss, stop, trail_price, trail_points, trail_offset, oca_name, comment, comment_profit, comment_loss, comment_trailing, alert_message, alert_profit, alert_loss, alert_trailing, disable_alert) => {
      const engine = context._strategyEngine;
      if (!engine) {
        console.warn("Strategy not initialized. Call strategy() first.");
        return;
      }
      const state = engine.getState();
      if (state.position_size === 0) {
        return;
      }
      const getVal = (v) => v instanceof Series ? v.get(0) : v;
      let exitQty;
      if (qty !== void 0) {
        exitQty = getVal(qty);
      } else if (qty_percent !== void 0) {
        exitQty = Math.abs(state.position_size) * (getVal(qty_percent) / 100);
      } else {
        exitQty = Math.abs(state.position_size);
      }
      const exitDirection = state.position_size > 0 ? "short" : "long";
      const entryPrice = state.position_avg_price;
      let limitPrice = limit !== void 0 ? getVal(limit) : void 0;
      let stopPrice = stop !== void 0 ? getVal(stop) : void 0;
      if (profit !== void 0 && limitPrice === void 0) {
        const profitVal = getVal(profit);
        if (state.position_size > 0) {
          limitPrice = entryPrice + profitVal;
        } else {
          limitPrice = entryPrice - profitVal;
        }
      }
      if (loss !== void 0 && stopPrice === void 0) {
        const lossVal = getVal(loss);
        if (state.position_size > 0) {
          stopPrice = entryPrice - lossVal;
        } else {
          stopPrice = entryPrice + lossVal;
        }
      }
      const ocaGroupName = oca_name || `exit_${id}_${context.idx}`;
      if (limitPrice !== void 0) {
        engine.addOrder({
          id: `${id}_tp`,
          direction: exitDirection,
          qty: exitQty,
          limit: limitPrice,
          oca_name: ocaGroupName,
          oca_type: "cancel",
          comment: comment_profit || comment,
          alert_message: alert_profit || alert_message,
          isExit: true
        });
      }
      if (stopPrice !== void 0) {
        engine.addOrder({
          id: `${id}_sl`,
          direction: exitDirection,
          qty: exitQty,
          stop: stopPrice,
          oca_name: ocaGroupName,
          oca_type: "cancel",
          comment: comment_loss || comment,
          alert_message: alert_loss || alert_message,
          isExit: true
        });
      }
      if (trail_points !== void 0 || trail_price !== void 0) {
        const currentPrice = context.data.close instanceof Series ? context.data.close.get(0) : context.data.close;
        let trailStop;
        if (trail_points !== void 0) {
          const points = getVal(trail_points);
          if (state.position_size > 0) {
            trailStop = currentPrice - points;
          } else {
            trailStop = currentPrice + points;
          }
        } else {
          trailStop = getVal(trail_price);
        }
        engine.addOrder({
          id: `${id}_trail`,
          direction: exitDirection,
          qty: exitQty,
          stop: trailStop,
          oca_name: ocaGroupName,
          oca_type: "cancel",
          comment: comment_trailing || comment,
          alert_message: alert_trailing || alert_message,
          isExit: true
        });
      }
      if (limitPrice === void 0 && stopPrice === void 0 && trail_points === void 0 && trail_price === void 0) {
        engine.addOrder({
          id,
          direction: exitDirection,
          qty: exitQty,
          comment,
          alert_message,
          isExit: true
        });
      }
    };
  }

  function grossloss(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getGrossLoss();
    };
  }

  function grossprofit(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getGrossProfit();
    };
  }

  function initial_capital(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 1e5;
      }
      return engine.getInitialCapital();
    };
  }

  function losstrades(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getLossTrades();
    };
  }

  function max_drawdown(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getMaxDrawdown();
    };
  }

  function max_runup(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getMaxRunup();
    };
  }

  function netprofit(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getNetProfit();
    };
  }

  function openprofit(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getOpenProfit();
    };
  }

  function opentrades(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getOpenTradesCount();
    };
  }

  function opentrades_entry_bar_index(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return NaN;
      }
      const trades = engine.getOpenTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return NaN;
      }
      return trades[trade_num].entry_bar_index;
    };
  }

  function opentrades_entry_id(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return "";
      }
      const trades = engine.getOpenTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return "";
      }
      return trades[trade_num].entry_id;
    };
  }

  function opentrades_entry_price(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return NaN;
      }
      const trades = engine.getOpenTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return NaN;
      }
      return trades[trade_num].entry_price;
    };
  }

  function opentrades_entry_time(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return NaN;
      }
      const trades = engine.getOpenTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return NaN;
      }
      return trades[trade_num].entry_time;
    };
  }

  function opentrades_profit(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      const trades = engine.getOpenTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return 0;
      }
      const trade = trades[trade_num];
      const currentPrice = context.data.close instanceof Series ? context.data.close.get(0) : context.data.close;
      if (trade.direction === "long") {
        return (currentPrice - trade.entry_price) * trade.size;
      } else {
        return (trade.entry_price - currentPrice) * trade.size;
      }
    };
  }

  function opentrades_size(context) {
    return (trade_num) => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      const trades = engine.getOpenTrades();
      if (trade_num < 0 || trade_num >= trades.length) {
        return 0;
      }
      return trades[trade_num].size;
    };
  }

  function order(context) {
    return (id, direction, qty, limit, stop, oca_name, oca_type, comment, alert_message, disable_alert) => {
      const engine = context._strategyEngine;
      if (!engine) {
        console.warn("Strategy not initialized. Call strategy() first.");
        return;
      }
      const getVal = (v) => v instanceof Series ? v.get(0) : v;
      const orderQty = qty !== void 0 ? getVal(qty) : engine.getDefaultQty();
      const limitPrice = limit !== void 0 ? getVal(limit) : void 0;
      const stopPrice = stop !== void 0 ? getVal(stop) : void 0;
      engine.addOrder({
        id: id || engine.generateOrderId(),
        direction,
        qty: orderQty,
        limit: limitPrice,
        stop: stopPrice,
        oca_name,
        oca_type,
        comment,
        alert_message
      });
    };
  }

  function param$4(context) {
    return (source, index, name) => {
      if (typeof source === "string") return source;
      if (source instanceof Series) {
        if (index) {
          return new Series(source.data, source.offset + index);
        }
        return source;
      }
      if (!Array.isArray(source) && typeof source === "object") return source;
      if (!context.params[name]) context.params[name] = [];
      if (Array.isArray(source)) {
        return new Series(source, index || 0);
      } else {
        if (context.params[name].length === 0) {
          context.params[name].push(source);
        } else {
          context.params[name][context.params[name].length - 1] = source;
        }
        return new Series(context.params[name], 0);
      }
    };
  }

  function position_avg_price(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getPositionAvgPrice();
    };
  }

  function position_size(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getPositionSize();
    };
  }

  function profit_factor(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getProfitFactor();
    };
  }

  function sharpe_ratio(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getSharpeRatio();
    };
  }

  const direction = {
    long: "long",
    short: "short",
    all: "all"
  };
  const oca_type = {
    none: "none",
    cancel: "cancel",
    reduce: "reduce"
  };
  const commission_type = {
    percent: "percent",
    cash_per_contract: "cash_per_contract",
    cash_per_order: "cash_per_order"
  };
  const position = {
    long: 1,
    short: -1,
    flat: 0
  };
  const cash = "cash";
  const fixed = "fixed";
  const percent_of_equity = "percent_of_equity";
  const DEFAULT_STRATEGY_OPTIONS = {
    title: "Strategy",
    overlay: true,
    pyramiding: 0,
    calc_on_order_fills: false,
    calc_on_every_tick: false,
    default_qty_type: "fixed",
    default_qty_value: 1,
    initial_capital: 1e5,
    currency: "USD",
    slippage: 0,
    commission_type: "percent",
    commission_value: 0,
    process_orders_on_close: false,
    close_entries_rule: "FIFO",
    margin_long: 100,
    margin_short: 100
  };

  var __defProp$q = Object.defineProperty;
  var __defNormalProp$q = (obj, key, value) => key in obj ? __defProp$q(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$q = (obj, key, value) => __defNormalProp$q(obj, typeof key !== "symbol" ? key + "" : key, value);
  class StrategyEngine {
    constructor(context) {
      __publicField$q(this, "context");
      __publicField$q(this, "state");
      __publicField$q(this, "_tradeIdCounter", 0);
      __publicField$q(this, "_orderIdCounter", 0);
      this.context = context;
      this.state = this.createInitialState();
    }
    createInitialState() {
      return {
        options: { ...DEFAULT_STRATEGY_OPTIONS },
        position_size: 0,
        position_avg_price: 0,
        position_entry_name: "",
        position_entry_bar_index: -1,
        position_entry_time: 0,
        open_trades: [],
        closed_trades: [],
        pending_orders: [],
        equity: DEFAULT_STRATEGY_OPTIONS.initial_capital,
        initial_capital: DEFAULT_STRATEGY_OPTIONS.initial_capital
      };
    }
    /**
     * Initialize strategy with options
     */
    initialize(options) {
      this.state.options = { ...DEFAULT_STRATEGY_OPTIONS, ...options };
      this.state.initial_capital = this.state.options.initial_capital || 1e5;
      this.state.equity = this.state.initial_capital;
    }
    /**
     * Process pending orders at the start of each bar
     * This simulates order execution based on OHLC data
     */
    processOrders() {
      const idx = this.context.idx;
      const open = this.getPrice("open");
      const high = this.getPrice("high");
      const low = this.getPrice("low");
      const close = this.getPrice("close");
      const time = this.getTime();
      const ordersToProcess = [...this.state.pending_orders];
      this.state.pending_orders = [];
      for (const order of ordersToProcess) {
        const fillResult = this.checkOrderFill(order, open, high, low, close);
        if (fillResult.filled) {
          this.executeOrder(order, fillResult.price, idx, time);
        } else {
          this.state.pending_orders.push(order);
        }
      }
      this.updateEquity();
    }
    /**
     * Check if an order should be filled based on OHLC data
     */
    checkOrderFill(order, open, high, low, close) {
      if (!order.limit && !order.stop) {
        return { filled: true, price: this.applySlippage(open, order.direction) };
      }
      if (order.stop && !order.limit) {
        if (order.direction === "long") {
          if (high >= order.stop) {
            const fillPrice = Math.max(open, order.stop);
            return { filled: true, price: this.applySlippage(fillPrice, order.direction) };
          }
        } else {
          if (low <= order.stop) {
            const fillPrice = Math.min(open, order.stop);
            return { filled: true, price: this.applySlippage(fillPrice, order.direction) };
          }
        }
      }
      if (order.limit && !order.stop) {
        if (order.direction === "long") {
          if (low <= order.limit) {
            const fillPrice = Math.min(open, order.limit);
            return { filled: true, price: this.applySlippage(fillPrice, order.direction) };
          }
        } else {
          if (high >= order.limit) {
            const fillPrice = Math.max(open, order.limit);
            return { filled: true, price: this.applySlippage(fillPrice, order.direction) };
          }
        }
      }
      if (order.stop && order.limit) {
        if (order.direction === "long") {
          if (high >= order.stop && low <= order.limit) {
            return { filled: true, price: this.applySlippage(order.limit, order.direction) };
          }
        } else {
          if (low <= order.stop && high >= order.limit) {
            return { filled: true, price: this.applySlippage(order.limit, order.direction) };
          }
        }
      }
      return { filled: false, price: 0 };
    }
    /**
     * Apply slippage to fill price
     */
    applySlippage(price, dir) {
      const slippage = this.state.options.slippage || 0;
      if (dir === "long") {
        return price * (1 + slippage / 100);
      } else {
        return price * (1 - slippage / 100);
      }
    }
    /**
     * Execute an order and update position
     */
    executeOrder(order, fillPrice, barIndex, time) {
      const commission = this.calculateCommission(order.qty, fillPrice);
      if (order.isExit) {
        this.closePosition(fillPrice, barIndex, time, order.qty, order.id);
      } else if (order.direction === "long") {
        this.openLongPosition(order, fillPrice, barIndex, time, commission);
      } else {
        this.openShortPosition(order, fillPrice, barIndex, time, commission);
      }
      if (order.oca_name) {
        this.handleOCA(order);
      }
    }
    /**
     * Open a long position
     */
    openLongPosition(order, fillPrice, barIndex, time, commission) {
      const currentSize = this.state.position_size;
      if (currentSize < 0) {
        this.closePosition(fillPrice, barIndex, time, Math.abs(currentSize), order.id);
      }
      const openLongTrades = this.state.open_trades.filter((t) => t.direction === "long").length;
      if (openLongTrades >= (this.state.options.pyramiding || 0) + 1 && currentSize > 0) {
        return;
      }
      const trade = {
        id: this.generateTradeId(),
        entry_id: order.id,
        entry_bar_index: barIndex,
        entry_time: time,
        entry_price: fillPrice,
        size: order.qty,
        direction: "long",
        commission,
        max_runup: 0,
        max_drawdown: 0
      };
      this.state.open_trades.push(trade);
      if (currentSize >= 0) {
        const totalSize = currentSize + order.qty;
        const totalCost = this.state.position_avg_price * currentSize + fillPrice * order.qty;
        this.state.position_avg_price = totalCost / totalSize;
        this.state.position_size = totalSize;
      } else {
        this.state.position_size = order.qty;
        this.state.position_avg_price = fillPrice;
      }
      if (this.state.position_entry_bar_index === -1) {
        this.state.position_entry_bar_index = barIndex;
        this.state.position_entry_time = time;
        this.state.position_entry_name = order.id;
      }
      this.state.equity -= commission;
    }
    /**
     * Open a short position
     */
    openShortPosition(order, fillPrice, barIndex, time, commission) {
      const currentSize = this.state.position_size;
      if (currentSize > 0) {
        this.closePosition(fillPrice, barIndex, time, currentSize, order.id);
      }
      const openShortTrades = this.state.open_trades.filter((t) => t.direction === "short").length;
      if (openShortTrades >= (this.state.options.pyramiding || 0) + 1 && currentSize < 0) {
        return;
      }
      const trade = {
        id: this.generateTradeId(),
        entry_id: order.id,
        entry_bar_index: barIndex,
        entry_time: time,
        entry_price: fillPrice,
        size: order.qty,
        direction: "short",
        commission,
        max_runup: 0,
        max_drawdown: 0
      };
      this.state.open_trades.push(trade);
      if (currentSize <= 0) {
        const totalSize = Math.abs(currentSize) + order.qty;
        const totalCost = this.state.position_avg_price * Math.abs(currentSize) + fillPrice * order.qty;
        this.state.position_avg_price = totalCost / totalSize;
        this.state.position_size = -totalSize;
      } else {
        this.state.position_size = -order.qty;
        this.state.position_avg_price = fillPrice;
      }
      if (this.state.position_entry_bar_index === -1) {
        this.state.position_entry_bar_index = barIndex;
        this.state.position_entry_time = time;
        this.state.position_entry_name = order.id;
      }
      this.state.equity -= commission;
    }
    /**
     * Close a position
     */
    closePosition(exitPrice, barIndex, time, qty, exitId) {
      const closeRule = this.state.options.close_entries_rule || "FIFO";
      let remainingQty = qty;
      const sortedTrades = [...this.state.open_trades];
      if (closeRule === "FIFO") {
        sortedTrades.sort((a, b) => a.entry_bar_index - b.entry_bar_index);
      } else {
        sortedTrades.sort((a, b) => b.entry_bar_index - a.entry_bar_index);
      }
      for (const trade of sortedTrades) {
        if (remainingQty <= 0) break;
        const closeQty = Math.min(trade.size, remainingQty);
        const commission = this.calculateCommission(closeQty, exitPrice);
        let profit;
        if (trade.direction === "long") {
          profit = (exitPrice - trade.entry_price) * closeQty - (trade.commission || 0) - commission;
        } else {
          profit = (trade.entry_price - exitPrice) * closeQty - (trade.commission || 0) - commission;
        }
        const profitPercent = profit / (trade.entry_price * closeQty) * 100;
        if (closeQty === trade.size) {
          trade.exit_id = exitId;
          trade.exit_bar_index = barIndex;
          trade.exit_time = time;
          trade.exit_price = exitPrice;
          trade.profit = profit;
          trade.profit_percent = profitPercent;
          trade.commission = (trade.commission || 0) + commission;
          this.state.closed_trades.push(trade);
          this.state.open_trades = this.state.open_trades.filter((t) => t.id !== trade.id);
        } else {
          const closedTrade = {
            ...trade,
            id: this.generateTradeId(),
            size: closeQty,
            exit_id: exitId,
            exit_bar_index: barIndex,
            exit_time: time,
            exit_price: exitPrice,
            profit,
            profit_percent: profitPercent,
            commission: (trade.commission || 0) * (closeQty / trade.size) + commission
          };
          this.state.closed_trades.push(closedTrade);
          trade.size -= closeQty;
          trade.commission = (trade.commission || 0) * ((trade.size + closeQty) / trade.size);
        }
        this.state.equity += profit;
        remainingQty -= closeQty;
      }
      if (this.state.open_trades.length === 0) {
        this.state.position_size = 0;
        this.state.position_avg_price = 0;
        this.state.position_entry_bar_index = -1;
        this.state.position_entry_time = 0;
        this.state.position_entry_name = "";
      } else {
        let totalSize = 0;
        let totalCost = 0;
        for (const t of this.state.open_trades) {
          const sign = t.direction === "long" ? 1 : -1;
          totalSize += t.size * sign;
          totalCost += t.entry_price * t.size;
        }
        this.state.position_size = totalSize;
        this.state.position_avg_price = totalCost / Math.abs(totalSize);
      }
    }
    /**
     * Close all positions
     */
    closeAllPositions(exitId = "close_all") {
      const currentPrice = this.getPrice("close");
      const barIndex = this.context.idx;
      const time = this.getTime();
      const totalQty = this.state.open_trades.reduce((sum, t) => sum + t.size, 0);
      if (totalQty > 0) {
        this.closePosition(currentPrice, barIndex, time, totalQty, exitId);
      }
    }
    /**
     * Handle OCA (One-Cancels-All) orders
     */
    handleOCA(filledOrder) {
      if (!filledOrder.oca_name) return;
      const ocaType = filledOrder.oca_type || "none";
      if (ocaType === "none") return;
      if (ocaType === "cancel") {
        this.state.pending_orders = this.state.pending_orders.filter(
          (o) => o.oca_name !== filledOrder.oca_name
        );
      } else if (ocaType === "reduce") {
        for (const order of this.state.pending_orders) {
          if (order.oca_name === filledOrder.oca_name) {
            order.qty = Math.max(0, order.qty - filledOrder.qty);
          }
        }
        this.state.pending_orders = this.state.pending_orders.filter((o) => o.qty > 0);
      }
    }
    /**
     * Calculate commission for a trade
     */
    calculateCommission(qty, price) {
      const commType = this.state.options.commission_type || "percent";
      const commValue = this.state.options.commission_value || 0;
      switch (commType) {
        case "percent":
          return price * qty * commValue / 100;
        case "cash_per_contract":
          return qty * commValue;
        case "cash_per_order":
          return commValue;
        default:
          return 0;
      }
    }
    /**
     * Update equity based on open positions
     */
    updateEquity() {
      const currentPrice = this.getPrice("close");
      let openProfit = 0;
      for (const trade of this.state.open_trades) {
        if (trade.direction === "long") {
          openProfit += (currentPrice - trade.entry_price) * trade.size;
        } else {
          openProfit += (trade.entry_price - currentPrice) * trade.size;
        }
        const tradeProfit = trade.direction === "long" ? (currentPrice - trade.entry_price) * trade.size : (trade.entry_price - currentPrice) * trade.size;
        trade.max_runup = Math.max(trade.max_runup || 0, tradeProfit);
        trade.max_drawdown = Math.min(trade.max_drawdown || 0, tradeProfit);
      }
      this.state.equity = this.state.initial_capital + this.getNetProfit() + openProfit;
    }
    /**
     * Add a pending order
     */
    addOrder(order) {
      this.state.pending_orders.push({
        ...order,
        bar_index: this.context.idx
      });
    }
    /**
     * Cancel a pending order by ID
     */
    cancelOrder(orderId) {
      const initialLength = this.state.pending_orders.length;
      this.state.pending_orders = this.state.pending_orders.filter((o) => o.id !== orderId);
      return this.state.pending_orders.length < initialLength;
    }
    /**
     * Cancel all pending orders
     */
    cancelAllOrders() {
      this.state.pending_orders = [];
    }
    // ==================== Getters ====================
    getState() {
      return this.state;
    }
    getPositionSize() {
      return this.state.position_size;
    }
    getPositionAvgPrice() {
      return this.state.position_avg_price;
    }
    getEquity() {
      return this.state.equity;
    }
    getInitialCapital() {
      return this.state.initial_capital;
    }
    getOpenProfit() {
      const currentPrice = this.getPrice("close");
      let openProfit = 0;
      for (const trade of this.state.open_trades) {
        if (trade.direction === "long") {
          openProfit += (currentPrice - trade.entry_price) * trade.size;
        } else {
          openProfit += (trade.entry_price - currentPrice) * trade.size;
        }
      }
      return openProfit;
    }
    getNetProfit() {
      return this.state.closed_trades.reduce((sum, t) => sum + (t.profit || 0), 0);
    }
    getGrossProfit() {
      return this.state.closed_trades.filter((t) => (t.profit || 0) > 0).reduce((sum, t) => sum + (t.profit || 0), 0);
    }
    getGrossLoss() {
      return Math.abs(
        this.state.closed_trades.filter((t) => (t.profit || 0) < 0).reduce((sum, t) => sum + (t.profit || 0), 0)
      );
    }
    getOpenTrades() {
      return this.state.open_trades;
    }
    getClosedTrades() {
      return this.state.closed_trades;
    }
    getOpenTradesCount() {
      return this.state.open_trades.length;
    }
    getClosedTradesCount() {
      return this.state.closed_trades.length;
    }
    getWinTrades() {
      return this.state.closed_trades.filter((t) => (t.profit || 0) > 0).length;
    }
    getLossTrades() {
      return this.state.closed_trades.filter((t) => (t.profit || 0) < 0).length;
    }
    getEventrades() {
      return this.state.closed_trades.filter((t) => (t.profit || 0) === 0).length;
    }
    getWinRate() {
      const total = this.getClosedTradesCount();
      if (total === 0) return 0;
      return this.getWinTrades() / total * 100;
    }
    getAvgTrade() {
      const total = this.getClosedTradesCount();
      if (total === 0) return 0;
      return this.getNetProfit() / total;
    }
    getAvgWinningTrade() {
      const winners = this.state.closed_trades.filter((t) => (t.profit || 0) > 0);
      if (winners.length === 0) return 0;
      return winners.reduce((sum, t) => sum + (t.profit || 0), 0) / winners.length;
    }
    getAvgLosingTrade() {
      const losers = this.state.closed_trades.filter((t) => (t.profit || 0) < 0);
      if (losers.length === 0) return 0;
      return losers.reduce((sum, t) => sum + (t.profit || 0), 0) / losers.length;
    }
    getMaxDrawdown() {
      let peak = this.state.initial_capital;
      let maxDrawdown = 0;
      let equity = this.state.initial_capital;
      for (const trade of this.state.closed_trades) {
        equity += trade.profit || 0;
        peak = Math.max(peak, equity);
        const drawdown = peak - equity;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
      return maxDrawdown;
    }
    getMaxRunup() {
      let trough = this.state.initial_capital;
      let maxRunup = 0;
      let equity = this.state.initial_capital;
      for (const trade of this.state.closed_trades) {
        equity += trade.profit || 0;
        trough = Math.min(trough, equity);
        const runup = equity - trough;
        maxRunup = Math.max(maxRunup, runup);
      }
      return maxRunup;
    }
    getProfitFactor() {
      const grossProfit = this.getGrossProfit();
      const grossLoss = this.getGrossLoss();
      if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
      return grossProfit / grossLoss;
    }
    getSharpeRatio() {
      if (this.state.closed_trades.length < 2) return 0;
      const returns = this.state.closed_trades.map((t) => t.profit || 0);
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev === 0) return 0;
      const riskFreeRate = (this.state.options.risk_free_rate || 0) / 100;
      return (avgReturn - riskFreeRate) / stdDev;
    }
    // ==================== Helpers ====================
    getPrice(field) {
      const data = this.context.data[field];
      if (data instanceof Series) {
        return data.get(0);
      }
      return data;
    }
    getTime() {
      const openTime = this.context.data.openTime;
      if (openTime instanceof Series) {
        return openTime.get(0);
      }
      if (Array.isArray(openTime)) {
        return openTime[openTime.length - 1];
      }
      return Date.now();
    }
    generateTradeId() {
      return `trade_${++this._tradeIdCounter}`;
    }
    generateOrderId() {
      return `order_${++this._orderIdCounter}`;
    }
    /**
     * Get default quantity based on strategy options
     */
    getDefaultQty() {
      const qtyType = this.state.options.default_qty_type || "fixed";
      const qtyValue = this.state.options.default_qty_value || 1;
      if (qtyType === "fixed") {
        return qtyValue;
      } else if (qtyType === "cash") {
        const price = this.getPrice("close");
        return Math.floor(qtyValue / price);
      } else if (qtyType === "percent_of_equity") {
        const price = this.getPrice("close");
        const equityAmount = this.state.equity * qtyValue / 100;
        return Math.floor(equityAmount / price);
      }
      return qtyValue;
    }
  }

  function strategy(context) {
    return (title, shorttitle, overlay, format, precision, scale, pyramiding, calc_on_order_fills, calc_on_every_tick, max_bars_back, backtest_fill_limits_assumption, default_qty_type, default_qty_value, initial_capital, currency, slippage, commission_type, commission_value, process_orders_on_close, close_entries_rule, margin_long, margin_short, explicit_plot_zorder, max_lines_count, max_labels_count, max_boxes_count, risk_free_rate, use_bar_magnifier, fill_orders_on_standard_ohlc, max_polylines_count) => {
      if (!context._strategyEngine) {
        context._strategyEngine = new StrategyEngine(context);
      }
      const options = {
        title,
        shorttitle,
        overlay: overlay ?? true,
        format,
        precision,
        scale,
        pyramiding: pyramiding ?? 0,
        calc_on_order_fills: calc_on_order_fills ?? false,
        calc_on_every_tick: calc_on_every_tick ?? false,
        max_bars_back,
        backtest_fill_limits_assumption,
        default_qty_type: default_qty_type ?? "fixed",
        default_qty_value: default_qty_value ?? 1,
        initial_capital: initial_capital ?? 1e5,
        currency: currency ?? "USD",
        slippage: slippage ?? 0,
        commission_type: commission_type ?? "percent",
        commission_value: commission_value ?? 0,
        process_orders_on_close: process_orders_on_close ?? false,
        close_entries_rule: close_entries_rule ?? "FIFO",
        margin_long: margin_long ?? 100,
        margin_short: margin_short ?? 100,
        explicit_plot_zorder,
        max_lines_count,
        max_labels_count,
        max_boxes_count,
        risk_free_rate: risk_free_rate ?? 0,
        use_bar_magnifier,
        fill_orders_on_standard_ohlc,
        max_polylines_count
      };
      Object.keys(options).forEach((key) => {
        if (options[key] === void 0) {
          delete options[key];
        }
      });
      context._strategyEngine.initialize(options);
      context.indicator = {
        title,
        shorttitle: shorttitle || title,
        overlay: overlay ?? true,
        precision,
        scale,
        isStrategy: true
      };
    };
  }

  function win_rate(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getWinRate();
    };
  }

  function wintrades(context) {
    return () => {
      const engine = context._strategyEngine;
      if (!engine) {
        return 0;
      }
      return engine.getWinTrades();
    };
  }

  var __defProp$p = Object.defineProperty;
  var __defNormalProp$p = (obj, key, value) => key in obj ? __defProp$p(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$p = (obj, key, value) => __defNormalProp$p(obj, typeof key !== "symbol" ? key + "" : key, value);
  const actionMethods = {
    cancel,
    cancel_all,
    close,
    close_all,
    entry,
    exit,
    order,
    param: param$4,
    strategy
  };
  const propertyMethods = {
    avg_losing_trade,
    avg_trade,
    avg_winning_trade,
    equity,
    eventrades,
    grossloss,
    grossprofit,
    initial_capital,
    losstrades,
    max_drawdown,
    max_runup,
    netprofit,
    openprofit,
    position_avg_price,
    position_size,
    profit_factor,
    sharpe_ratio,
    win_rate,
    wintrades
  };
  const subNamespaceCountMethods = {
    closedtrades,
    opentrades
  };
  const opentradesMethods = {
    opentrades_entry_bar_index,
    opentrades_entry_id,
    opentrades_entry_price,
    opentrades_entry_time,
    opentrades_profit,
    opentrades_size
  };
  const closedtradesMethods = {
    closedtrades_commission,
    closedtrades_entry_bar_index,
    closedtrades_entry_price,
    closedtrades_exit_bar_index,
    closedtrades_exit_price,
    closedtrades_max_drawdown,
    closedtrades_max_runup,
    closedtrades_profit,
    closedtrades_size
  };
  class PineStrategy {
    constructor(context) {
      __publicField$p(this, "context");
      __publicField$p(this, "_propertyCache", {});
      // Constants
      __publicField$p(this, "direction", direction);
      __publicField$p(this, "oca", oca_type);
      __publicField$p(this, "commission", commission_type);
      __publicField$p(this, "position", position);
      __publicField$p(this, "cash", cash);
      __publicField$p(this, "fixed", fixed);
      __publicField$p(this, "percent_of_equity", percent_of_equity);
      __publicField$p(this, "long", "long");
      __publicField$p(this, "short", "short");
      // Sub-namespaces (callable with methods attached)
      __publicField$p(this, "opentrades");
      __publicField$p(this, "closedtrades");
      // Action methods
      __publicField$p(this, "cancel");
      __publicField$p(this, "cancel_all");
      __publicField$p(this, "close");
      __publicField$p(this, "close_all");
      __publicField$p(this, "entry");
      __publicField$p(this, "exit");
      __publicField$p(this, "order");
      __publicField$p(this, "param");
      __publicField$p(this, "strategy");
      // Properties (using Object.defineProperty for getters)
      __publicField$p(this, "position_size");
      __publicField$p(this, "position_avg_price");
      __publicField$p(this, "equity");
      __publicField$p(this, "initial_capital");
      __publicField$p(this, "openprofit");
      __publicField$p(this, "netprofit");
      __publicField$p(this, "grossprofit");
      __publicField$p(this, "grossloss");
      __publicField$p(this, "wintrades");
      __publicField$p(this, "losstrades");
      __publicField$p(this, "eventrades");
      __publicField$p(this, "max_drawdown");
      __publicField$p(this, "max_runup");
      __publicField$p(this, "profit_factor");
      __publicField$p(this, "avg_trade");
      __publicField$p(this, "avg_winning_trade");
      __publicField$p(this, "avg_losing_trade");
      __publicField$p(this, "win_rate");
      __publicField$p(this, "sharpe_ratio");
      this.context = context;
      if (!context._strategyEngine) {
        context._strategyEngine = new StrategyEngine(context);
      }
      Object.entries(actionMethods).forEach(([name, factory]) => {
        this[name] = factory(context);
      });
      Object.entries(propertyMethods).forEach(([name, factory]) => {
        this._propertyCache[name] = factory(context);
        Object.defineProperty(this, name, {
          get: () => this._propertyCache[name](),
          enumerable: true
        });
      });
      const opentradesCountFn = subNamespaceCountMethods.opentrades(context);
      const opentradesNs = Object.assign(
        () => opentradesCountFn(),
        Object.fromEntries(
          Object.entries(opentradesMethods).map(([name, factory]) => [
            name.replace("opentrades_", ""),
            factory(context)
          ])
        )
      );
      this.opentrades = opentradesNs;
      const closedtradesCountFn = subNamespaceCountMethods.closedtrades(context);
      const closedtradesNs = Object.assign(
        () => closedtradesCountFn(),
        Object.fromEntries(
          Object.entries(closedtradesMethods).map(([name, factory]) => [
            name.replace("closedtrades_", ""),
            factory(context)
          ])
        )
      );
      this.closedtrades = closedtradesNs;
    }
    /**
     * Process pending orders - called at the start of each bar
     */
    processOrders() {
      if (this.context._strategyEngine) {
        this.context._strategyEngine.processOrders();
      }
    }
  }

  var __defProp$o = Object.defineProperty;
  var __defNormalProp$o = (obj, key, value) => key in obj ? __defProp$o(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$o = (obj, key, value) => __defNormalProp$o(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Barstate {
    constructor(context) {
      this.context = context;
      __publicField$o(this, "_live", false);
    }
    setLive() {
      this._live = true;
    }
    get isnew() {
      return !this._live;
    }
    get islast() {
      return this.context.idx === this.context.data.close.data.length - 1;
    }
    get isfirst() {
      return this.context.idx === 0;
    }
    get ishistory() {
      return this.context.idx < this.context.data.close.data.length - 1;
    }
    get isrealtime() {
      return this.context.idx === this.context.data.close.data.length - 1;
    }
    get isconfirmed() {
      return this.context.data.closeTime[this.context.data.closeTime.length - 1] <= (/* @__PURE__ */ new Date()).getTime();
    }
    get islastconfirmedhistory() {
      return this.context.data.closeTime[this.context.data.closeTime.length - 1] <= (/* @__PURE__ */ new Date()).getTime();
    }
  }

  class PineTypeObject {
    constructor(_definition, context) {
      this._definition = _definition;
      this.context = context;
      for (let key in _definition) {
        this[key] = _definition[key];
      }
    }
    get __def__() {
      return this._definition;
    }
    copy() {
      return new PineTypeObject(this.__def__, this.context);
    }
    toString() {
      const obj = {};
      for (let key in this.__def__) {
        obj[key] = this[key];
      }
      return JSON.stringify(obj);
    }
  }

  function isPlot(arg) {
    return typeof arg === "object" && arg.title !== void 0 && arg.data !== void 0 && arg.options !== void 0;
  }
  const TYPE_CHECK = {
    series: (arg) => arg instanceof Series || typeof arg === "number" || typeof arg === "string" || typeof arg === "boolean",
    string: (arg) => typeof arg === "string",
    number: (arg) => typeof arg === "number",
    boolean: (arg) => typeof arg === "boolean",
    array: (arg) => Array.isArray(arg),
    object: (arg) => typeof arg === "object",
    primitive: (arg) => typeof arg === null || typeof arg !== "object" && typeof arg !== "function",
    function: (arg) => typeof arg === "function",
    undefined: (arg) => arg === void 0,
    null: (arg) => arg === null,
    NaN: (arg) => isNaN(arg),
    //TODO should we exclude the other PineTS Objects ?
    remaining_options: (arg) => typeof arg === "object" && !(arg instanceof Series) && !isPlot(arg)
  };
  function parseArgsForPineParams(args, signatures, types, override) {
    if (Array.isArray(signatures) && typeof signatures[0] === "string") {
      signatures = [signatures];
    }
    const options = {};
    let options_arg = {};
    const valid = new Array(signatures.length).fill(true);
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (TYPE_CHECK.remaining_options(arg)) {
        options_arg = arg;
        break;
      }
      const curOptions = signatures.map((e, idx) => valid[idx] ? e[i] : void 0);
      for (let o = 0; o < curOptions.length; o++) {
        const optionName = curOptions[o];
        if (optionName === void 0) {
          valid[o] = false;
          continue;
        }
        const typeChecker = TYPE_CHECK[types[optionName]];
        if (typeof typeChecker === "function" && typeChecker(arg)) {
          options[optionName] = arg;
        } else {
          valid[o] = false;
        }
      }
    }
    return { ...options_arg, ...options, ...override };
  }

  var __defProp$n = Object.defineProperty;
  var __defNormalProp$n = (obj, key, value) => key in obj ? __defProp$n(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$n = (obj, key, value) => __defNormalProp$n(obj, typeof key !== "symbol" ? key + "" : key, value);
  const INDICATOR_SIGNATURE = [
    "title",
    "shorttitle",
    "overlay",
    "format",
    "precision",
    "scale",
    "max_bars_back",
    "timeframe",
    "timeframe_gaps",
    "explicit_plot_zorder",
    "max_lines_count",
    "max_labels_count",
    "max_boxes_count",
    "calc_bars_count",
    "max_polylines_count",
    "dynamic_requests",
    "behind_chart"
  ];
  const INDICATOR_ARGS_TYPES = {
    title: "string",
    shorttitle: "string",
    overlay: "boolean",
    format: "string",
    precision: "number",
    scale: "string",
    ////TODO : handle enums types
    max_bars_back: "number",
    timeframe: "string",
    timeframe_gaps: "boolean",
    explicit_plot_zorder: "boolean",
    max_lines_count: "number",
    max_labels_count: "number",
    max_boxes_count: "number",
    calc_bars_count: "number",
    max_polylines_count: "number",
    dynamic_requests: "boolean",
    behind_chart: "boolean"
  };
  function parseIndicatorOptions(args) {
    return parseArgsForPineParams(args, INDICATOR_SIGNATURE, INDICATOR_ARGS_TYPES);
  }
  class Core {
    constructor(context) {
      this.context = context;
      __publicField$n(this, "color", {
        param: (source, index = 0) => {
          return Series.from(source).get(index);
        },
        rgb: (r, g, b, a) => a ? `rgba(${r}, ${g}, ${b}, ${(100 - a) / 100})` : `rgb(${r}, ${g}, ${b})`,
        new: (color, a) => {
          if (color && color.startsWith("#")) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return a ? `rgba(${r}, ${g}, ${b}, ${(100 - a) / 100})` : `rgb(${r}, ${g}, ${b})`;
          }
          return a ? `rgba(${color}, ${(100 - a) / 100})` : color;
        },
        /**
         * Extracts the red component from a color (0-255)
         */
        r: (color) => {
          return this._parseColorComponent(color, "r");
        },
        /**
         * Extracts the green component from a color (0-255)
         */
        g: (color) => {
          return this._parseColorComponent(color, "g");
        },
        /**
         * Extracts the blue component from a color (0-255)
         */
        b: (color) => {
          return this._parseColorComponent(color, "b");
        },
        /**
         * Extracts the transparency component from a color (0-100, where 0 is opaque)
         */
        t: (color) => {
          return this._parseColorComponent(color, "t");
        },
        /**
         * Creates a color from a gradient between two colors based on a value's position in a range
         * @param value - The value to map to the gradient
         * @param bottom_value - The bottom of the range
         * @param top_value - The top of the range
         * @param bottom_color - The color at the bottom of the range
         * @param top_color - The color at the top of the range
         * @returns The interpolated color
         */
        from_gradient: (value, bottom_value, top_value, bottom_color, top_color) => {
          if (value === null || value === void 0 || Number.isNaN(value)) {
            return "";
          }
          const clampedValue = Math.max(bottom_value, Math.min(top_value, value));
          const range = top_value - bottom_value;
          const position = range === 0 ? 0.5 : (clampedValue - bottom_value) / range;
          const bottomRGB = this._colorToRGB(bottom_color);
          const topRGB = this._colorToRGB(top_color);
          const r = Math.round(bottomRGB.r + (topRGB.r - bottomRGB.r) * position);
          const g = Math.round(bottomRGB.g + (topRGB.g - bottomRGB.g) * position);
          const b = Math.round(bottomRGB.b + (topRGB.b - bottomRGB.b) * position);
          const a = bottomRGB.a + (topRGB.a - bottomRGB.a) * position;
          if (a < 1) {
            return `rgba(${r}, ${g}, ${b}, ${a})`;
          }
          return `rgb(${r}, ${g}, ${b})`;
        },
        // Standard web colors
        white: "#FFFFFF",
        lime: "#00FF00",
        green: "#008000",
        red: "#FF0000",
        maroon: "#800000",
        black: "#000000",
        gray: "#808080",
        blue: "#0000FF",
        yellow: "#FFFF00",
        orange: "#FFA500",
        purple: "#800080",
        pink: "#FFC0CB",
        brown: "#A52A2A",
        teal: "#008080",
        cyan: "#00FFFF",
        navy: "#000080",
        indigo: "#4B0082",
        violet: "#EE82EE",
        magenta: "#FF00FF",
        rose: "#FF007F",
        gold: "#FFD700",
        silver: "#C0C0C0",
        bronze: "#CD7F32",
        // Additional missing colors from Pine Script
        aqua: "#00FFFF",
        // Same as cyan
        fuchsia: "#FF00FF",
        // Same as magenta
        olive: "#808000"
      });
      /**
       * Runtime error namespace
       */
      __publicField$n(this, "runtime", {
        /**
         * Throws a runtime error with the specified message.
         * In Pine Script, this stops script execution.
         * @param message - The error message
         */
        error: (message) => {
          throw new Error(`[Runtime Error] ${message}`);
        }
      });
    }
    /**
     * Converts a color string to RGB components
     */
    _colorToRGB(color) {
      if (!color) return { r: 0, g: 0, b: 0, a: 1 };
      if (color.startsWith("#")) {
        const hex = color.slice(1);
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
          a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
        };
      }
      const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
      if (rgbMatch) {
        return {
          r: parseInt(rgbMatch[1], 10),
          g: parseInt(rgbMatch[2], 10),
          b: parseInt(rgbMatch[3], 10),
          a: rgbMatch[4] !== void 0 ? parseFloat(rgbMatch[4]) : 1
        };
      }
      const namedColors = {
        white: "#FFFFFF",
        lime: "#00FF00",
        green: "#008000",
        red: "#FF0000",
        maroon: "#800000",
        black: "#000000",
        gray: "#808080",
        blue: "#0000FF",
        yellow: "#FFFF00",
        orange: "#FFA500",
        purple: "#800080",
        pink: "#FFC0CB",
        brown: "#A52A2A",
        teal: "#008080",
        cyan: "#00FFFF",
        navy: "#000080",
        indigo: "#4B0082",
        violet: "#EE82EE",
        magenta: "#FF00FF",
        rose: "#FF007F",
        gold: "#FFD700",
        silver: "#C0C0C0",
        bronze: "#CD7F32",
        aqua: "#00FFFF",
        fuchsia: "#FF00FF",
        olive: "#808000"
      };
      const lowerColor = color.toLowerCase();
      if (namedColors[lowerColor]) {
        return this._colorToRGB(namedColors[lowerColor]);
      }
      return { r: 0, g: 0, b: 0, a: 1 };
    }
    /**
     * Parses a color component from a color string
     */
    _parseColorComponent(color, component) {
      const rgb = this._colorToRGB(color);
      switch (component) {
        case "r":
          return rgb.r;
        case "g":
          return rgb.g;
        case "b":
          return rgb.b;
        case "t":
          return Math.round((1 - rgb.a) * 100);
        default:
          return 0;
      }
    }
    extractPlotOptions(options) {
      const _options = {};
      for (let key in options) {
        _options[key] = Series.from(options[key]).get(0);
      }
      return _options;
    }
    indicator(...args) {
      const options = parseIndicatorOptions(args);
      const defaults = {
        title: "",
        shorttitle: "",
        overlay: false,
        format: "inherit",
        precision: 10,
        scale: "points",
        max_bars_back: 0,
        timeframe: "",
        timeframe_gaps: true,
        explicit_plot_zorder: false,
        max_lines_count: 50,
        max_labels_count: 50,
        max_boxes_count: 50,
        calc_bars_count: 0,
        max_polylines_count: 50,
        dynamic_requests: false,
        behind_chart: true
      };
      this.context.indicator = { ...defaults, ...options };
      return this.context.indicator;
    }
    get bar_index() {
      return this.context.idx;
    }
    na(series) {
      return isNaN(Series.from(series).get(0));
    }
    nz(series, replacement = 0) {
      const val = Series.from(series).get(0);
      const rep = Series.from(replacement).get(0);
      return isNaN(val) ? rep : val;
    }
    fixnan(series) {
      const _s = Series.from(series);
      for (let i = 0; i < _s.length; i++) {
        const val = _s.get(i);
        if (!isNaN(val)) {
          return val;
        }
      }
      return NaN;
    }
    alertcondition(condition, title, message) {
    }
    alert(message, freq) {
      console.log(`[ALERT] ${message}`);
    }
    /**
     * Declares the script as a library.
     * In PineTS, this is a no-op as library functionality is not needed.
     * @param title - The library title
     * @param overlay - Whether the library uses overlay mode
     */
    library(title, overlay = false) {
      this.context.isLibrary = true;
      this.context.libraryTitle = title;
      this.context.libraryOverlay = overlay;
    }
    /**
     * Sets the maximum number of bars back that the script can reference.
     * In Pine Script, this is used to ensure historical data availability.
     * In PineTS, this is primarily informational.
     * @param target - The series to set max bars back for
     * @param length - The number of bars back to reference
     */
    max_bars_back(target, length) {
      this.context.maxBarsBack = Math.max(this.context.maxBarsBack || 0, length);
    }
    // Time functions - extract time components from a timestamp
    /**
     * Returns the day of month (1-31) from a UNIX timestamp
     */
    dayofmonth(time) {
      const t = time !== void 0 ? Series.from(time).get(0) : this.context.pine.time;
      if (t === null || t === void 0 || Number.isNaN(t)) return NaN;
      return new Date(t).getUTCDate();
    }
    /**
     * Returns the day of week (1=Sunday, 7=Saturday) from a UNIX timestamp
     */
    dayofweek(time) {
      const t = time !== void 0 ? Series.from(time).get(0) : this.context.pine.time;
      if (t === null || t === void 0 || Number.isNaN(t)) return NaN;
      return new Date(t).getUTCDay() + 1;
    }
    /**
     * Returns the hour (0-23) from a UNIX timestamp
     */
    hour(time) {
      const t = time !== void 0 ? Series.from(time).get(0) : this.context.pine.time;
      if (t === null || t === void 0 || Number.isNaN(t)) return NaN;
      return new Date(t).getUTCHours();
    }
    /**
     * Returns the minute (0-59) from a UNIX timestamp
     */
    minute(time) {
      const t = time !== void 0 ? Series.from(time).get(0) : this.context.pine.time;
      if (t === null || t === void 0 || Number.isNaN(t)) return NaN;
      return new Date(t).getUTCMinutes();
    }
    /**
     * Returns the second (0-59) from a UNIX timestamp
     */
    second(time) {
      const t = time !== void 0 ? Series.from(time).get(0) : this.context.pine.time;
      if (t === null || t === void 0 || Number.isNaN(t)) return NaN;
      return new Date(t).getUTCSeconds();
    }
    /**
     * Returns the month (1-12) from a UNIX timestamp
     */
    month(time) {
      const t = time !== void 0 ? Series.from(time).get(0) : this.context.pine.time;
      if (t === null || t === void 0 || Number.isNaN(t)) return NaN;
      return new Date(t).getUTCMonth() + 1;
    }
    /**
     * Returns the year from a UNIX timestamp
     */
    year(time) {
      const t = time !== void 0 ? Series.from(time).get(0) : this.context.pine.time;
      if (t === null || t === void 0 || Number.isNaN(t)) return NaN;
      return new Date(t).getUTCFullYear();
    }
    /**
     * Returns the week of year (1-53) from a UNIX timestamp
     */
    weekofyear(time) {
      const t = time !== void 0 ? Series.from(time).get(0) : this.context.pine.time;
      if (t === null || t === void 0 || Number.isNaN(t)) return NaN;
      const date = new Date(t);
      const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
    }
    /**
     * Creates a UNIX timestamp from date/time components
     * @param year - Year
     * @param month - Month (1-12)
     * @param day - Day of month (1-31)
     * @param hour - Hour (0-23), default 0
     * @param minute - Minute (0-59), default 0
     * @param second - Second (0-59), default 0
     * @returns UNIX timestamp in milliseconds
     */
    timestamp(year, month, day, hour = 0, minute = 0, second = 0) {
      const y = Series.from(year).get(0);
      const mo = Series.from(month).get(0);
      const d = Series.from(day).get(0);
      const h = Series.from(hour).get(0);
      const mi = Series.from(minute).get(0);
      const s = Series.from(second).get(0);
      if ([y, mo, d].some((v) => v === null || v === void 0 || Number.isNaN(v))) {
        return NaN;
      }
      return Date.UTC(y, mo - 1, d, h || 0, mi || 0, s || 0);
    }
    //types
    bool(series) {
      const val = Series.from(series).get(0);
      return !isNaN(val) && val !== 0;
    }
    int(series) {
      const val = Series.from(series).get(0);
      if (typeof val !== "number")
        throw new Error(
          `Cannot call "int" with argument "x"="${val}". An argument of "literal string" type was used but a "simple int" is expected.`
        );
      return Math.floor(val);
    }
    float(series) {
      const val = Series.from(series).get(0);
      if (typeof val !== "number")
        throw new Error(
          `Cannot call "float" with argument "x"="${val}". An argument of "literal string" type was used but a "const float" is expected.`
        );
      return val;
    }
    string(series) {
      const val = Series.from(series).get(0);
      return val.toString();
    }
    Type(definition) {
      const definitionKeys = Object.keys(definition);
      const UDT = {
        new: function(...args) {
          const mappedArgs = {};
          for (let i = 0; i < args.length; i++) {
            mappedArgs[definitionKeys[i]] = args[i];
          }
          return new PineTypeObject(mappedArgs, this.context);
        },
        copy: function(object) {
          return new PineTypeObject(object.__def__, this.context);
        }
      };
      return UDT;
    }
  }

  const INPUT_SIGNATURES = [
    ["defval", "title", "tooltip", "inline", "group", "display"],
    ["defval", "title", "tooltip", "group", "confirm", "display"],
    ["defval", "title", "tooltip", "inline", "group", "confirm", "display"],
    ["defval", "title", "options", "tooltip", "inline", "group", "confirm", "display"],
    ["defval", "title", "minval", "maxval", "step", "tooltip", "inline", "group", "confirm", "display"]
  ];
  const INPUT_ARGS_TYPES = {
    defval: "primitive",
    title: "string",
    tooltip: "string",
    inline: "string",
    group: "string",
    display: "string",
    confirm: "boolean",
    options: "array",
    minval: "number",
    maxval: "number",
    step: "number"
  };
  function parseInputOptions(args) {
    return parseArgsForPineParams(args, INPUT_SIGNATURES, INPUT_ARGS_TYPES);
  }
  function resolveInput(context, options) {
    if (options.title && context.inputs && context.inputs[options.title] !== void 0) {
      return context.inputs[options.title];
    }
    return options.defval;
  }

  function any(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function bool(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return options.defval;
    };
  }

  function color(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function enum_fn(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function float(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function int(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function param$3(context) {
    return (source, index = 0) => {
      const val = Series.from(source).get(index);
      return val;
    };
  }

  function price(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function session(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function source(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function string(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function symbol(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function text_area(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function time(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return resolveInput(context, options);
    };
  }

  function timeframe(context) {
    return (...args) => {
      const options = parseInputOptions(args);
      return options.defval;
    };
  }

  var __defProp$m = Object.defineProperty;
  var __defNormalProp$m = (obj, key, value) => key in obj ? __defProp$m(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$m = (obj, key, value) => __defNormalProp$m(obj, typeof key !== "symbol" ? key + "" : key, value);
  const methods$3 = {
    any,
    bool,
    color,
    enum: enum_fn,
    float,
    int,
    param: param$3,
    price,
    session,
    source,
    string,
    symbol,
    text_area,
    time,
    timeframe
  };
  class Input {
    constructor(context) {
      this.context = context;
      __publicField$m(this, "any");
      __publicField$m(this, "bool");
      __publicField$m(this, "color");
      __publicField$m(this, "enum");
      __publicField$m(this, "float");
      __publicField$m(this, "int");
      __publicField$m(this, "param");
      __publicField$m(this, "price");
      __publicField$m(this, "session");
      __publicField$m(this, "source");
      __publicField$m(this, "string");
      __publicField$m(this, "symbol");
      __publicField$m(this, "text_area");
      __publicField$m(this, "time");
      __publicField$m(this, "timeframe");
      Object.entries(methods$3).forEach(([name, factory]) => {
        this[name] = factory(context);
      });
    }
  }

  function __eq(context) {
    return (a, b) => {
      const valA = Series.from(a).get(0);
      const valB = Series.from(b).get(0);
      if (typeof valA === "number" && typeof valB === "number") {
        if (isNaN(valA) && isNaN(valB)) return true;
        if (isNaN(valA) || isNaN(valB)) return false;
        return Math.abs(valA - valB) < 1e-8;
      }
      return valA === valB;
    };
  }

  function abs(context) {
    return (source) => {
      return Math.abs(Series.from(source).get(0));
    };
  }

  function acos(context) {
    return (source) => {
      return Math.acos(Series.from(source).get(0));
    };
  }

  function asin(context) {
    return (source) => {
      return Math.asin(Series.from(source).get(0));
    };
  }

  function atan(context) {
    return (source) => {
      return Math.atan(Series.from(source).get(0));
    };
  }

  function avg(context) {
    return (...sources) => {
      const values = sources.map((source) => {
        return Series.from(source).get(0);
      });
      const sum = values.reduce((acc, val) => acc + val, 0);
      return sum / values.length;
    };
  }

  function ceil(context) {
    return (source) => {
      return Math.ceil(Series.from(source).get(0));
    };
  }

  function cos(context) {
    return (source) => {
      return Math.cos(Series.from(source).get(0));
    };
  }

  function e(context) {
    return () => {
      return Math.E;
    };
  }

  function exp(context) {
    return (source) => {
      return Math.exp(Series.from(source).get(0));
    };
  }

  function floor(context) {
    return (source) => {
      return Math.floor(Series.from(source).get(0));
    };
  }

  function ln(context) {
    return (source) => {
      return Math.log(Series.from(source).get(0));
    };
  }

  function log(context) {
    return (source) => {
      return Math.log(Series.from(source).get(0));
    };
  }

  function log10(context) {
    return (source) => {
      return Math.log10(Series.from(source).get(0));
    };
  }

  function max(context) {
    return (...source) => {
      const args = source.map((e) => Series.from(e).get(0));
      return Math.max(...args);
    };
  }

  function min(context) {
    return (...source) => {
      const args = source.map((e) => Series.from(e).get(0));
      return Math.min(...args);
    };
  }

  function param$2(context) {
    return (source, index, name) => {
      if (typeof source === "string") return source;
      if (source instanceof Series) {
        if (index) {
          return new Series(source.data, source.offset + index);
        }
        return source;
      }
      if (!Array.isArray(source) && typeof source === "object") return source;
      if (!context.params[name]) context.params[name] = [];
      if (Array.isArray(source)) {
        return new Series(source, index || 0);
      } else {
        if (context.params[name].length === 0) {
          context.params[name].push(source);
        } else {
          context.params[name][context.params[name].length - 1] = source;
        }
        return new Series(context.params[name], 0);
      }
    };
  }

  function phi(context) {
    return () => {
      return 1.618033988749895;
    };
  }

  function pi(context) {
    return () => {
      return Math.PI;
    };
  }

  function pow(context) {
    return (source, power) => {
      return Math.pow(Series.from(source).get(0), Series.from(power).get(0));
    };
  }

  function random(context) {
    return () => {
      return Math.random();
    };
  }

  function round(context) {
    return (source) => {
      return Math.round(Series.from(source).get(0));
    };
  }

  function round_to_mintick(context) {
    return (source) => {
      return context.precision(Math.round(Series.from(source).get(0) / context.pine.syminfo.mintick) * context.pine.syminfo.mintick);
    };
  }

  function rphi(context) {
    return () => {
      return 0.6180339887498948;
    };
  }

  function sign(context) {
    return (source) => {
      return Math.sign(Series.from(source).get(0));
    };
  }

  function sin(context) {
    return (source) => {
      return Math.sin(Series.from(source).get(0));
    };
  }

  function sqrt(context) {
    return (source) => {
      return Math.sqrt(Series.from(source).get(0));
    };
  }

  function sum(context) {
    return (source, length) => {
      const len = Series.from(length).get(0);
      const series = Series.from(source);
      let total = 0;
      for (let i = 0; i < len; i++) {
        const val = series.get(i);
        total += val;
      }
      return total;
    };
  }

  function tan(context) {
    return (source) => {
      return Math.tan(Series.from(source).get(0));
    };
  }

  function todegrees(context) {
    return (radians) => {
      const value = Series.from(radians).get(0);
      if (value === null || value === void 0 || Number.isNaN(value)) {
        return NaN;
      }
      return value * (180 / Math.PI);
    };
  }

  function toradians(context) {
    return (degrees) => {
      const value = Series.from(degrees).get(0);
      if (value === null || value === void 0 || Number.isNaN(value)) {
        return NaN;
      }
      return value * (Math.PI / 180);
    };
  }

  var __defProp$l = Object.defineProperty;
  var __defNormalProp$l = (obj, key, value) => key in obj ? __defProp$l(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$l = (obj, key, value) => __defNormalProp$l(obj, typeof key !== "symbol" ? key + "" : key, value);
  const methods$2 = {
    __eq,
    abs,
    acos,
    asin,
    atan,
    avg,
    ceil,
    cos,
    e,
    exp,
    floor,
    ln,
    log,
    log10,
    max,
    min,
    param: param$2,
    phi,
    pi,
    pow,
    random,
    round,
    round_to_mintick,
    rphi,
    sign,
    sin,
    sqrt,
    sum,
    tan,
    todegrees,
    toradians
  };
  class PineMath {
    constructor(context) {
      this.context = context;
      __publicField$l(this, "_cache", {});
      __publicField$l(this, "__eq");
      __publicField$l(this, "abs");
      __publicField$l(this, "acos");
      __publicField$l(this, "asin");
      __publicField$l(this, "atan");
      __publicField$l(this, "avg");
      __publicField$l(this, "ceil");
      __publicField$l(this, "cos");
      __publicField$l(this, "e");
      __publicField$l(this, "exp");
      __publicField$l(this, "floor");
      __publicField$l(this, "ln");
      __publicField$l(this, "log");
      __publicField$l(this, "log10");
      __publicField$l(this, "max");
      __publicField$l(this, "min");
      __publicField$l(this, "param");
      __publicField$l(this, "phi");
      __publicField$l(this, "pi");
      __publicField$l(this, "pow");
      __publicField$l(this, "random");
      __publicField$l(this, "round");
      __publicField$l(this, "round_to_mintick");
      __publicField$l(this, "rphi");
      __publicField$l(this, "sign");
      __publicField$l(this, "sin");
      __publicField$l(this, "sqrt");
      __publicField$l(this, "sum");
      __publicField$l(this, "tan");
      __publicField$l(this, "todegrees");
      __publicField$l(this, "toradians");
      Object.entries(methods$2).forEach(([name, factory]) => {
        this[name] = factory(context);
      });
    }
  }

  function unwrapParam$1(param) {
    if (Array.isArray(param) && param.length === 2 && typeof param[1] === "string") {
      return param[0];
    }
    return param;
  }
  function currency_rate(context) {
    return (from, to, ignore_invalid_currency = false) => {
      const rawFrom = unwrapParam$1(from);
      const rawTo = unwrapParam$1(to);
      const _from = (Series.from(rawFrom).get(0)?.toString() || "").toUpperCase();
      const _to = (Series.from(rawTo).get(0)?.toString() || "").toUpperCase();
      if (_from === _to) {
        return 1;
      }
      const rates = {
        "USD_EUR": 0.92,
        "EUR_USD": 1.09,
        "USD_GBP": 0.79,
        "GBP_USD": 1.27,
        "USD_JPY": 149.5,
        "JPY_USD": 67e-4,
        "USD_CHF": 0.88,
        "CHF_USD": 1.14,
        "USD_CAD": 1.36,
        "CAD_USD": 0.74,
        "USD_AUD": 1.53,
        "AUD_USD": 0.65,
        "EUR_GBP": 0.86,
        "GBP_EUR": 1.16,
        "EUR_JPY": 163,
        "JPY_EUR": 61e-4,
        "BTC_USD": 1e5,
        "USD_BTC": 1e-5,
        "ETH_USD": 3500,
        "USD_ETH": 286e-6
      };
      const key = `${_from}_${_to}`;
      if (rates[key] !== void 0) {
        return rates[key];
      }
      const fromUsdKey = `${_from}_USD`;
      const usdToKey = `USD_${_to}`;
      if (rates[fromUsdKey] !== void 0 && rates[usdToKey] !== void 0) {
        return rates[fromUsdKey] * rates[usdToKey];
      }
      if (ignore_invalid_currency) {
        return NaN;
      }
      return NaN;
    };
  }

  function dividends(context) {
    return (ticker = null, field = "gross", gaps = true, lookahead = false, ignore_invalid_symbol = false, currency = null) => {
      return NaN;
    };
  }

  function earnings(context) {
    return (ticker = null, field = "actual", gaps = true, lookahead = false, ignore_invalid_symbol = false, currency = null) => {
      if (field === "actual" || field === "estimate" || field === "standardized") {
        return NaN;
      }
      return [NaN, NaN, NaN];
    };
  }

  function economic(context) {
    return (country_code, field, gaps = true, ignore_invalid_symbol = false) => {
      return NaN;
    };
  }

  function financial(context) {
    return (symbol, financial_id, period = "FQ", gaps = true, ignore_invalid_symbol = false, currency = null) => {
      return NaN;
    };
  }

  function param$1(context) {
    return (source, index, name) => {
      if (!context.params[name]) context.params[name] = [];
      let val;
      if (source instanceof Series) {
        val = source.get(index || 0);
      } else if (Array.isArray(source)) {
        const hasOnlySeries = source.every((elem) => elem instanceof Series);
        const hasOnlyScalars = source.every((elem) => !(elem instanceof Series) && !Array.isArray(elem));
        const isTuple = (hasOnlySeries || hasOnlyScalars) && source.length >= 1;
        if (isTuple) {
          if (hasOnlySeries) {
            val = source.map((s) => s.get(0));
          } else {
            val = source;
          }
        } else {
          val = Series.from(source).get(index || 0);
        }
      } else {
        val = source;
      }
      if (context.params[name].length === 0) {
        context.params[name].push(val);
      } else {
        context.params[name][context.params[name].length - 1] = val;
      }
      return [val, name];
    };
  }

  function quandl(context) {
    return (ticker, gaps = true, index = 0, ignore_invalid_symbol = false) => {
      console.warn("request.quandl() is deprecated. Use request.security() instead.");
      return NaN;
    };
  }

  const TIMEFRAMES = ["1", "3", "5", "15", "30", "45", "60", "120", "180", "240", "D", "W", "M"];

  function findSecContextIdx(myOpenTime, myCloseTime, openTime, closeTime, lookahead = false) {
    for (let i = 0; i < openTime.length; i++) {
      if (openTime[i] <= myOpenTime && myCloseTime <= closeTime[i]) {
        if (lookahead) {
          return i;
        }
        return myCloseTime >= closeTime[i] ? i : i - 1;
      }
    }
    return -1;
  }

  function findLTFContextIdx(myOpenTime, myCloseTime, openTime, closeTime, lookahead = false, mainContextEDate, gaps = false) {
    for (let i = openTime.length - 1; i >= 0; i--) {
      if (closeTime[i] <= myCloseTime && openTime[i] >= myOpenTime) {
        const isCurrentBar = mainContextEDate && myCloseTime > mainContextEDate;
        if (gaps && lookahead) {
          for (let j = 0; j < openTime.length; j++) {
            if (openTime[j] >= myOpenTime && openTime[j] < myCloseTime) {
              return j;
            }
            if (openTime[j] >= myCloseTime) {
              break;
            }
          }
        }
        if (isCurrentBar && lookahead && !gaps) {
          for (let j = 0; j < openTime.length; j++) {
            if (openTime[j] >= myOpenTime && openTime[j] < myCloseTime) {
              return j;
            }
            if (openTime[j] >= myCloseTime) {
              break;
            }
          }
        }
        return i;
      }
      if (closeTime[i] < myOpenTime) {
        break;
      }
    }
    return -1;
  }

  function security(context) {
    return async (symbol, timeframe, expression, gaps = false, lookahead = false, ignore_invalid_symbol = false, currency = null, calc_bars_count = null) => {
      const _symbol = symbol[0];
      const _timeframe = timeframe[0];
      const _expression = expression[0];
      const _expression_name = expression[1];
      const _gaps = Array.isArray(gaps) ? gaps[0] : gaps;
      const _lookahead = Array.isArray(lookahead) ? lookahead[0] : lookahead;
      if (context.isSecondaryContext) {
        return _expression;
      }
      const ctxTimeframeIdx = TIMEFRAMES.indexOf(context.timeframe);
      const reqTimeframeIdx = TIMEFRAMES.indexOf(_timeframe);
      if (ctxTimeframeIdx == -1 || reqTimeframeIdx == -1) {
        throw new Error("Invalid timeframe");
      }
      if (ctxTimeframeIdx === reqTimeframeIdx) {
        return _expression;
      }
      const isLTF = ctxTimeframeIdx > reqTimeframeIdx;
      const myOpenTime = Series.from(context.data.openTime).get(0);
      const myCloseTime = Series.from(context.data.closeTime).get(0);
      const cacheKey = `${_symbol}_${_timeframe}_${_expression_name}`;
      const gapCacheKey = `${cacheKey}_prevIdx`;
      if (context.cache[cacheKey]) {
        const secContext2 = context.cache[cacheKey];
        const secContextIdx2 = isLTF ? findLTFContextIdx(
          myOpenTime,
          myCloseTime,
          secContext2.data.openTime.data,
          secContext2.data.closeTime.data,
          _lookahead,
          context.eDate,
          _gaps
        ) : findSecContextIdx(myOpenTime, myCloseTime, secContext2.data.openTime.data, secContext2.data.closeTime.data, _lookahead);
        if (secContextIdx2 == -1) {
          return NaN;
        }
        const value2 = secContext2.params[_expression_name][secContextIdx2];
        if (!isLTF && _gaps) {
          const prevIdx = context.cache[gapCacheKey];
          if (prevIdx !== void 0 && prevIdx === secContextIdx2) {
            return NaN;
          }
          context.cache[gapCacheKey] = secContextIdx2;
          return Array.isArray(value2) ? [value2] : value2;
        }
        return Array.isArray(value2) ? [value2] : value2;
      }
      const buffer = 1e3 * 60 * 60 * 24 * 30;
      const adjustedSDate = context.sDate ? context.sDate - buffer : void 0;
      const limit = context.sDate && context.eDate ? void 0 : context.limit || 1e3;
      const pineTS = new PineTS(context.source, _symbol, _timeframe, limit, adjustedSDate, void 0);
      pineTS.markAsSecondary();
      const secContext = await pineTS.run(context.pineTSCode);
      context.cache[cacheKey] = secContext;
      const secContextIdx = isLTF ? findLTFContextIdx(
        myOpenTime,
        myCloseTime,
        secContext.data.openTime.data,
        secContext.data.closeTime.data,
        _lookahead,
        context.eDate,
        _gaps
      ) : findSecContextIdx(myOpenTime, myCloseTime, secContext.data.openTime.data, secContext.data.closeTime.data, _lookahead);
      if (secContextIdx == -1) {
        return NaN;
      }
      const value = secContext.params[_expression_name][secContextIdx];
      if (!isLTF && _gaps) {
        context.cache[gapCacheKey] = secContextIdx;
        return NaN;
      }
      return Array.isArray(value) ? [value] : value;
    };
  }

  function security_lower_tf(context) {
    return async (symbol, timeframe, expression, ignore_invalid_symbol = false, currency = null, ignore_invalid_timeframe = false, calc_bars_count = 0) => {
      const _symbol = symbol[0];
      const _timeframe = timeframe[0];
      const _expression = expression[0];
      const _expression_name = expression[1];
      Array.isArray(ignore_invalid_symbol) ? ignore_invalid_symbol[0] : ignore_invalid_symbol;
      const _ignore_invalid_timeframe = Array.isArray(ignore_invalid_timeframe) ? ignore_invalid_timeframe[0] : ignore_invalid_timeframe;
      if (context.isSecondaryContext) {
        return Array.isArray(_expression) ? [_expression] : _expression;
      }
      const ctxTimeframeIdx = TIMEFRAMES.indexOf(context.timeframe);
      const reqTimeframeIdx = TIMEFRAMES.indexOf(_timeframe);
      if (ctxTimeframeIdx === -1 || reqTimeframeIdx === -1) {
        if (_ignore_invalid_timeframe) return NaN;
        throw new Error("Invalid timeframe");
      }
      if (reqTimeframeIdx > ctxTimeframeIdx) {
        if (_ignore_invalid_timeframe) return NaN;
        throw new Error(`Timeframe ${_timeframe} is not lower than or equal to chart timeframe ${context.timeframe}`);
      }
      if (reqTimeframeIdx === ctxTimeframeIdx) {
        return [[_expression]];
      }
      const cacheKey = `${_symbol}_${_timeframe}_${_expression_name}_lower`;
      if (!context.cache[cacheKey]) {
        const buffer = 1e3 * 60 * 60 * 24 * 30;
        const adjustedSDate = context.sDate ? context.sDate - buffer : void 0;
        const limit = context.sDate && context.eDate ? void 0 : context.limit || 1e3;
        const pineTS = new PineTS(context.source, _symbol, _timeframe, limit, adjustedSDate, context.eDate);
        pineTS.markAsSecondary();
        const secContext2 = await pineTS.run(context.pineTSCode);
        context.cache[cacheKey] = secContext2;
      }
      const secContext = context.cache[cacheKey];
      const myOpenTime = Series.from(context.data.openTime).get(0);
      const myCloseTime = Series.from(context.data.closeTime).get(0);
      const secOpenTimes = secContext.data.openTime.data;
      const secCloseTimes = secContext.data.closeTime.data;
      const secValues = secContext.params[_expression_name];
      if (!secValues) return [];
      const result = [];
      for (let i = 0; i < secOpenTimes.length; i++) {
        const sOpen = secOpenTimes[i];
        const sClose = secCloseTimes[i];
        if (sClose <= myOpenTime) continue;
        if (sOpen >= myCloseTime) break;
        if (sOpen >= myOpenTime && sOpen < myCloseTime) {
          result.push(secValues[i]);
        }
      }
      return [result];
    };
  }

  function unwrapParam(param) {
    if (Array.isArray(param) && param.length === 2 && typeof param[1] === "string") {
      return param[0];
    }
    return param;
  }
  function seed(context) {
    return (simple_string) => {
      const _simple_string = unwrapParam(simple_string);
      if (_simple_string) {
        let hash = 0;
        const str = String(_simple_string);
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return Math.abs(hash);
      }
      const barIndex = context.idx || 0;
      const openTime = context.data?.openTime?.get(0) || Date.now();
      return Math.abs(barIndex * 31337 ^ openTime % 2147483647);
    };
  }

  function splits(context) {
    return (ticker = null, field = "numerator", gaps = true, lookahead = false, ignore_invalid_symbol = false) => {
      if (field === "numerator" || field === "denominator") {
        return NaN;
      }
      return [NaN, NaN];
    };
  }

  var __defProp$k = Object.defineProperty;
  var __defNormalProp$k = (obj, key, value) => key in obj ? __defProp$k(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$k = (obj, key, value) => __defNormalProp$k(obj, typeof key !== "symbol" ? key + "" : key, value);
  const methods$1 = {
    currency_rate,
    dividends,
    earnings,
    economic,
    financial,
    param: param$1,
    quandl,
    security,
    security_lower_tf,
    seed,
    splits
  };
  class PineRequest {
    constructor(context) {
      this.context = context;
      __publicField$k(this, "_cache", {});
      __publicField$k(this, "currency_rate");
      __publicField$k(this, "dividends");
      __publicField$k(this, "earnings");
      __publicField$k(this, "economic");
      __publicField$k(this, "financial");
      __publicField$k(this, "param");
      __publicField$k(this, "quandl");
      __publicField$k(this, "security");
      __publicField$k(this, "security_lower_tf");
      __publicField$k(this, "seed");
      __publicField$k(this, "splits");
      Object.entries(methods$1).forEach(([name, factory]) => {
        this[name] = factory(context);
      });
    }
  }

  function accdist(context) {
    return (_callId) => {
      if (!context.taState) context.taState = {};
      const stateKey = _callId || "accdist";
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevCumulativeSum: 0,
          // Tentative state
          currentCumulativeSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevCumulativeSum = state.currentCumulativeSum;
        }
        state.lastIdx = context.idx;
      }
      const close = context.get(context.data.close, 0);
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      const volume = context.get(context.data.volume, 0);
      if (isNaN(close) || isNaN(high) || isNaN(low) || isNaN(volume)) {
        state.currentCumulativeSum = state.prevCumulativeSum;
        return context.precision(state.prevCumulativeSum);
      }
      const range = high - low;
      let term = 0;
      if (range !== 0) {
        term = (close - low - (high - close)) / range * volume;
      }
      const currentSum = state.prevCumulativeSum + term;
      state.currentCumulativeSum = currentSum;
      return context.precision(currentSum);
    };
  }

  function alma(context) {
    return (source, _period, _offset, _sigma, _callId) => {
      const period = Series.from(_period).get(0);
      const offset = Series.from(_offset).get(0);
      const sigma = Series.from(_sigma).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `alma_${period}_${offset}_${sigma}`;
      if (!context.taState[stateKey]) {
        const m = offset * (period - 1);
        const s = period / sigma;
        const weights = [];
        let weightSum = 0;
        for (let i = 0; i < period; i++) {
          const weight = Math.exp(-Math.pow(i - m, 2) / (2 * s * s));
          weights.push(weight);
          weightSum += weight;
        }
        for (let i = 0; i < weights.length; i++) {
          weights[i] /= weightSum;
        }
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state (working window)
          currentWindow: [],
          weights
          // weights are constant
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const window = [...state.prevWindow];
      window.unshift(currentValue);
      if (window.length > period) {
        window.pop();
      }
      state.currentWindow = window;
      if (window.length < period) {
        return NaN;
      }
      let alma2 = 0;
      for (let i = 0; i < period; i++) {
        alma2 += state.weights[i] * window[period - 1 - i];
      }
      return context.precision(alma2);
    };
  }

  function atr(context) {
    return (_period, _callId) => {
      const period = Series.from(_period).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `atr_${period}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevAtr: null,
          prevInitSum: 0,
          prevInitCount: 0,
          prevPrevClose: null,
          // "Previous" of the previous close
          // Tentative state
          currentAtr: null,
          currentInitSum: 0,
          currentInitCount: 0,
          currentPrevClose: null
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevAtr = state.currentAtr;
          state.prevInitSum = state.currentInitSum;
          state.prevInitCount = state.currentInitCount;
          state.prevPrevClose = state.currentPrevClose;
        }
        state.lastIdx = context.idx;
      }
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      const close = context.get(context.data.close, 0);
      if (isNaN(high) || isNaN(low) || isNaN(close)) {
        return NaN;
      }
      const prevClose = state.prevPrevClose;
      let tr;
      if (prevClose !== null) {
        const hl = high - low;
        const hc = Math.abs(high - prevClose);
        const lc = Math.abs(low - prevClose);
        tr = Math.max(hl, hc, lc);
      } else {
        tr = high - low;
      }
      state.currentPrevClose = close;
      let initCount = state.prevInitCount;
      let initSum = state.prevInitSum;
      let prevAtr = state.prevAtr;
      if (initCount < period) {
        initSum += tr;
        initCount++;
        state.currentInitSum = initSum;
        state.currentInitCount = initCount;
        if (initCount === period) {
          const atr3 = initSum / period;
          state.currentAtr = atr3;
          return context.precision(atr3);
        }
        return NaN;
      }
      const atr2 = (prevAtr * (period - 1) + tr) / period;
      state.currentAtr = atr2;
      return context.precision(atr2);
    };
  }

  function barssince(context) {
    return (condition, _callId) => {
      if (!context.taState) context.taState = {};
      const stateKey = _callId || "barssince";
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevLastTrueIndex: null,
          // Tentative state
          currentLastTrueIndex: null
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevLastTrueIndex = state.currentLastTrueIndex;
        }
        state.lastIdx = context.idx;
      }
      const cond = Series.from(condition).get(0);
      let lastTrueIndex = state.prevLastTrueIndex;
      if (cond) {
        lastTrueIndex = context.idx;
      }
      state.currentLastTrueIndex = lastTrueIndex;
      if (lastTrueIndex === null) {
        return NaN;
      }
      return context.idx - lastTrueIndex;
    };
  }

  function bb(context) {
    return (source, _length, _mult, _callId) => {
      const length = Series.from(_length).get(0);
      const mult = Series.from(_mult).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `bb_${length}_${mult}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          prevSum: 0,
          // Tentative state
          currentWindow: [],
          currentSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
          state.prevSum = state.currentSum;
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      if (isNaN(currentValue)) {
        state.currentWindow = [...state.prevWindow];
        state.currentSum = state.prevSum;
        return [[NaN, NaN, NaN]];
      }
      const window = [...state.prevWindow];
      let sum = state.prevSum;
      window.unshift(currentValue);
      sum += currentValue;
      if (window.length > length) {
        const oldValue = window.pop();
        sum -= oldValue;
      }
      state.currentWindow = window;
      state.currentSum = sum;
      if (window.length < length) {
        return [[NaN, NaN, NaN]];
      }
      const middle = sum / length;
      let sumSquaredDiff = 0;
      for (let i = 0; i < length; i++) {
        sumSquaredDiff += Math.pow(window[i] - middle, 2);
      }
      const stdev = Math.sqrt(sumSquaredDiff / length);
      const upper = middle + mult * stdev;
      const lower = middle - mult * stdev;
      return [[context.precision(upper), context.precision(middle), context.precision(lower)]];
    };
  }

  function bbw(context) {
    return (source, _length, _mult, _callId) => {
      const length = Series.from(_length).get(0);
      const mult = Series.from(_mult).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `bbw_${length}_${mult}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          prevSum: 0,
          // Tentative state
          currentWindow: [],
          currentSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
          state.prevSum = state.currentSum;
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      if (isNaN(currentValue)) {
        state.currentWindow = [...state.prevWindow];
        state.currentSum = state.prevSum;
        return NaN;
      }
      const window = [...state.prevWindow];
      let sum = state.prevSum;
      window.unshift(currentValue);
      sum += currentValue;
      if (window.length > length) {
        const removed = window.pop();
        sum -= removed;
      }
      state.currentWindow = window;
      state.currentSum = sum;
      if (window.length < length) {
        return NaN;
      }
      const basis = sum / length;
      let sumSqDiff = 0;
      for (let i = 0; i < length; i++) {
        const diff = window[i] - basis;
        sumSqDiff += diff * diff;
      }
      const variance = sumSqDiff / length;
      const stdev = Math.sqrt(variance);
      const dev = mult * stdev;
      if (basis === 0) {
        return context.precision(0);
      }
      const bbw2 = 2 * dev / basis * 100;
      return context.precision(bbw2);
    };
  }

  function cci(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `cci_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          prevSum: 0,
          // Tentative state
          currentWindow: [],
          currentSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
          state.prevSum = state.currentSum;
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      if (isNaN(currentValue)) {
        return NaN;
      }
      const window = [...state.prevWindow];
      let sum = state.prevSum;
      window.unshift(currentValue);
      sum += currentValue;
      if (window.length < length) {
        state.currentWindow = window;
        state.currentSum = sum;
        return NaN;
      }
      if (window.length > length) {
        const oldValue = window.pop();
        sum -= oldValue;
      }
      state.currentWindow = window;
      state.currentSum = sum;
      const sma = sum / length;
      let sumAbsoluteDeviations = 0;
      for (let i = 0; i < length; i++) {
        sumAbsoluteDeviations += Math.abs(window[i] - sma);
      }
      const meanDeviation = sumAbsoluteDeviations / length;
      if (meanDeviation === 0) {
        return 0;
      }
      const cci2 = (currentValue - sma) / (0.015 * meanDeviation);
      return context.precision(cci2);
    };
  }

  function change(context) {
    return (source, _length = 1, _callId) => {
      if (typeof _length === "string") {
        _callId = _length;
        _length = 1;
      }
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `change_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state
          currentWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const window = [...state.prevWindow];
      window.unshift(currentValue);
      if (window.length <= length) {
        state.currentWindow = window;
        return NaN;
      }
      if (window.length > length + 1) {
        window.pop();
      }
      state.currentWindow = window;
      const change2 = currentValue - window[length];
      return context.precision(change2);
    };
  }

  function cmo(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `cmo_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevGainsWindow: [],
          prevLossesWindow: [],
          prevGainsSum: 0,
          prevLossesSum: 0,
          // Tentative state
          currentGainsWindow: [],
          currentLossesWindow: [],
          currentGainsSum: 0,
          currentLossesSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevGainsWindow = [...state.currentGainsWindow];
          state.prevLossesWindow = [...state.currentLossesWindow];
          state.prevGainsSum = state.currentGainsSum;
          state.prevLossesSum = state.currentLossesSum;
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const previousValue = Series.from(source).get(1);
      if (isNaN(currentValue) || isNaN(previousValue)) {
        return NaN;
      }
      const mom = currentValue - previousValue;
      const gain = mom >= 0 ? mom : 0;
      const loss = mom >= 0 ? 0 : -mom;
      const gainsWindow = [...state.prevGainsWindow];
      const lossesWindow = [...state.prevLossesWindow];
      let gainsSum = state.prevGainsSum;
      let lossesSum = state.prevLossesSum;
      gainsWindow.unshift(gain);
      lossesWindow.unshift(loss);
      gainsSum += gain;
      lossesSum += loss;
      if (gainsWindow.length < length) {
        state.currentGainsWindow = gainsWindow;
        state.currentLossesWindow = lossesWindow;
        state.currentGainsSum = gainsSum;
        state.currentLossesSum = lossesSum;
        return NaN;
      }
      if (gainsWindow.length > length) {
        const oldGain = gainsWindow.pop();
        const oldLoss = lossesWindow.pop();
        gainsSum -= oldGain;
        lossesSum -= oldLoss;
      }
      state.currentGainsWindow = gainsWindow;
      state.currentLossesWindow = lossesWindow;
      state.currentGainsSum = gainsSum;
      state.currentLossesSum = lossesSum;
      const denominator = gainsSum + lossesSum;
      if (denominator === 0) {
        return context.precision(0);
      }
      const cmo2 = 100 * (gainsSum - lossesSum) / denominator;
      return context.precision(cmo2);
    };
  }

  function cog(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      const sourceSeries = Series.from(source);
      let sum = 0;
      let hasNaN = false;
      for (let i = 0; i < length; i++) {
        const value = sourceSeries.get(i);
        if (isNaN(value)) {
          hasNaN = true;
          break;
        }
        sum += value;
      }
      if (hasNaN) {
        return NaN;
      }
      let num = 0;
      for (let i = 0; i < length; i++) {
        const price = sourceSeries.get(i);
        num += price * (i + 1);
      }
      if (sum === 0) {
        return NaN;
      }
      const cog2 = -num / sum;
      return context.precision(cog2);
    };
  }

  function correlation(context) {
    return (source1, source2, _length, _callId) => {
      const length = Series.from(_length).get(0);
      const s1 = Series.from(source1);
      const s2 = Series.from(source2);
      if (context.idx < length - 1) {
        return NaN;
      }
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;
      let sumY2 = 0;
      let count = 0;
      for (let i = 0; i < length; i++) {
        const x = s1.get(i);
        const y = s2.get(i);
        if (isNaN(x) || isNaN(y)) continue;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
        count++;
      }
      if (count < 2) return NaN;
      const numerator = count * sumXY - sumX * sumY;
      const denominatorX = count * sumX2 - sumX * sumX;
      const denominatorY = count * sumY2 - sumY * sumY;
      if (denominatorX <= 0 || denominatorY <= 0) return context.precision(0);
      const r = numerator / Math.sqrt(denominatorX * denominatorY);
      return context.precision(r);
    };
  }

  function cross(context) {
    return (source1, source2, _callId) => {
      const series1 = Series.from(source1);
      const series2 = Series.from(source2);
      const current1 = series1.get(0);
      const current2 = series2.get(0);
      const prev1 = series1.get(1);
      const prev2 = series2.get(1);
      if (isNaN(current1) || isNaN(current2) || isNaN(prev1) || isNaN(prev2)) {
        return false;
      }
      const crossedOver = current1 > current2 && prev1 <= prev2;
      const crossedUnder = current1 < current2 && prev1 >= prev2;
      return crossedOver || crossedUnder;
    };
  }

  function crossover(context) {
    return (source1, source2) => {
      const s1 = Series.from(source1);
      const s2 = Series.from(source2);
      const current1 = s1.get(0);
      const current2 = s2.get(0);
      const prev1 = s1.get(1);
      const prev2 = s2.get(1);
      return prev1 < prev2 && current1 > current2;
    };
  }

  function crossunder(context) {
    return (source1, source2) => {
      const s1 = Series.from(source1);
      const s2 = Series.from(source2);
      const current1 = s1.get(0);
      const current2 = s2.get(0);
      const prev1 = s1.get(1);
      const prev2 = s2.get(1);
      return prev1 > prev2 && current1 < current2;
    };
  }

  function cum(context) {
    return (source, _callId) => {
      if (!context.taState) context.taState = {};
      const stateKey = _callId || "cum";
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevCumulativeSum: 0,
          // Tentative state
          currentCumulativeSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevCumulativeSum = state.currentCumulativeSum;
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      if (isNaN(currentValue)) {
        state.currentCumulativeSum = state.prevCumulativeSum;
        return context.precision(state.prevCumulativeSum);
      }
      const currentSum = state.prevCumulativeSum + currentValue;
      state.currentCumulativeSum = currentSum;
      return context.precision(currentSum);
    };
  }

  function dev(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `dev_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          prevSum: 0,
          // Tentative state
          currentWindow: [],
          currentSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
          state.prevSum = state.currentSum;
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0) || 0;
      const window = [...state.prevWindow];
      let sum = state.prevSum;
      window.unshift(currentValue);
      sum += currentValue;
      if (window.length > length) {
        const oldValue = window.pop();
        sum -= oldValue;
      }
      state.currentWindow = window;
      state.currentSum = sum;
      if (window.length < length) {
        return NaN;
      }
      const mean = sum / length;
      let sumDeviation = 0;
      for (let i = 0; i < length; i++) {
        sumDeviation += Math.abs(window[i] - mean);
      }
      const dev2 = sumDeviation / length;
      return context.precision(dev2);
    };
  }

  function dmi(context) {
    return (_diLength, _adxSmoothing, _callId) => {
      const diLength = Series.from(_diLength).get(0);
      const adxSmoothing = Series.from(_adxSmoothing).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `dmi_${diLength}_${adxSmoothing}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevHigh: NaN,
          prevLow: NaN,
          prevClose: NaN,
          // RMA states for TR, +DM, -DM
          prevTrInitSum: 0,
          prevPlusInitSum: 0,
          prevMinusInitSum: 0,
          prevInitCount: 0,
          prevSmoothedTR: NaN,
          prevSmoothedPlus: NaN,
          prevSmoothedMinus: NaN,
          // RMA state for ADX
          prevDxInitSum: 0,
          prevAdxInitCount: 0,
          prevADX: NaN,
          // Tentative state (current)
          currentHigh: NaN,
          currentLow: NaN,
          currentClose: NaN,
          currentTrInitSum: 0,
          currentPlusInitSum: 0,
          currentMinusInitSum: 0,
          currentInitCount: 0,
          currentSmoothedTR: NaN,
          currentSmoothedPlus: NaN,
          currentSmoothedMinus: NaN,
          currentDxInitSum: 0,
          currentAdxInitCount: 0,
          currentADX: NaN
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevHigh = state.currentHigh;
          state.prevLow = state.currentLow;
          state.prevClose = state.currentClose;
          state.prevTrInitSum = state.currentTrInitSum;
          state.prevPlusInitSum = state.currentPlusInitSum;
          state.prevMinusInitSum = state.currentMinusInitSum;
          state.prevInitCount = state.currentInitCount;
          state.prevSmoothedTR = state.currentSmoothedTR;
          state.prevSmoothedPlus = state.currentSmoothedPlus;
          state.prevSmoothedMinus = state.currentSmoothedMinus;
          state.prevDxInitSum = state.currentDxInitSum;
          state.prevAdxInitCount = state.currentAdxInitCount;
          state.prevADX = state.currentADX;
        }
        state.lastIdx = context.idx;
      }
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      const close = context.get(context.data.close, 0);
      if (isNaN(high) || isNaN(low) || isNaN(close)) {
        return [[NaN, NaN, NaN]];
      }
      state.currentHigh = high;
      state.currentLow = low;
      state.currentClose = close;
      if (isNaN(state.prevHigh)) {
        return [[NaN, NaN, NaN]];
      }
      const tr = Math.max(high - low, Math.abs(high - state.prevClose), Math.abs(low - state.prevClose));
      const up = high - state.prevHigh;
      const down = state.prevLow - low;
      const plusDM = up > down && up > 0 ? up : 0;
      const minusDM = down > up && down > 0 ? down : 0;
      let initCount = state.prevInitCount;
      let trInitSum = state.prevTrInitSum;
      let plusInitSum = state.prevPlusInitSum;
      let minusInitSum = state.prevMinusInitSum;
      let smoothedTR = state.prevSmoothedTR;
      let smoothedPlus = state.prevSmoothedPlus;
      let smoothedMinus = state.prevSmoothedMinus;
      initCount++;
      if (initCount <= diLength) {
        trInitSum += tr;
        plusInitSum += plusDM;
        minusInitSum += minusDM;
        if (initCount === diLength) {
          smoothedTR = trInitSum / diLength;
          smoothedPlus = plusInitSum / diLength;
          smoothedMinus = minusInitSum / diLength;
        }
      } else {
        const alpha = 1 / diLength;
        smoothedTR = alpha * tr + (1 - alpha) * smoothedTR;
        smoothedPlus = alpha * plusDM + (1 - alpha) * smoothedPlus;
        smoothedMinus = alpha * minusDM + (1 - alpha) * smoothedMinus;
      }
      state.currentInitCount = initCount;
      state.currentTrInitSum = trInitSum;
      state.currentPlusInitSum = plusInitSum;
      state.currentMinusInitSum = minusInitSum;
      state.currentSmoothedTR = smoothedTR;
      state.currentSmoothedPlus = smoothedPlus;
      state.currentSmoothedMinus = smoothedMinus;
      if (initCount < diLength) {
        return [[NaN, NaN, NaN]];
      }
      const plusDI = smoothedTR === 0 ? 0 : 100 * smoothedPlus / smoothedTR;
      const minusDI = smoothedTR === 0 ? 0 : 100 * smoothedMinus / smoothedTR;
      const sumDI = plusDI + minusDI;
      const dx = sumDI === 0 ? 0 : 100 * Math.abs(plusDI - minusDI) / sumDI;
      let adxInitCount = state.prevAdxInitCount;
      let dxInitSum = state.prevDxInitSum;
      let prevADX = state.prevADX;
      let adx = NaN;
      adxInitCount++;
      if (adxInitCount <= adxSmoothing) {
        dxInitSum += dx;
        if (adxInitCount === adxSmoothing) {
          prevADX = dxInitSum / adxSmoothing;
          adx = prevADX;
        }
      } else {
        const alphaAdx = 1 / adxSmoothing;
        prevADX = alphaAdx * dx + (1 - alphaAdx) * prevADX;
        adx = prevADX;
      }
      state.currentAdxInitCount = adxInitCount;
      state.currentDxInitSum = dxInitSum;
      state.currentADX = prevADX;
      return [[context.precision(plusDI), context.precision(minusDI), context.precision(adx)]];
    };
  }

  function ema(context) {
    return (source, _period, _callId) => {
      const period = Series.from(_period).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `ema_${period}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state (from end of lastIdx-1)
          prevEma: null,
          prevInitSum: 0,
          prevInitCount: 0,
          // Tentative state (for current lastIdx)
          currentEma: null,
          currentInitSum: 0,
          currentInitCount: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevEma = state.currentEma;
          state.prevInitSum = state.currentInitSum;
          state.prevInitCount = state.currentInitCount;
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      if (currentValue === null || currentValue === void 0 || isNaN(currentValue)) {
        return NaN;
      }
      let initCount = state.prevInitCount;
      let initSum = state.prevInitSum;
      let prevEma = state.prevEma;
      if (initCount < period) {
        initSum += currentValue;
        initCount++;
        state.currentInitSum = initSum;
        state.currentInitCount = initCount;
        if (initCount === period) {
          const ema3 = initSum / period;
          state.currentEma = ema3;
          return context.precision(ema3);
        }
        return NaN;
      }
      const alpha = 2 / (period + 1);
      const ema2 = currentValue * alpha + prevEma * (1 - alpha);
      state.currentEma = ema2;
      return context.precision(ema2);
    };
  }

  function falling(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      const series = Series.from(source);
      for (let i = 0; i < length; i++) {
        const current = series.get(i);
        const next = series.get(i + 1);
        if (isNaN(current) || isNaN(next)) {
          return false;
        }
        if (current >= next) {
          return false;
        }
      }
      return true;
    };
  }

  function highest(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `highest_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state
          currentWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const window = [...state.prevWindow];
      window.unshift(currentValue);
      if (window.length < length) {
        state.currentWindow = window;
        return NaN;
      }
      if (window.length > length) {
        window.pop();
      }
      state.currentWindow = window;
      const validValues = window.filter((v) => !isNaN(v) && v !== void 0);
      if (validValues.length === 0) {
        return NaN;
      }
      const max = Math.max(...validValues);
      return context.precision(max);
    };
  }

  function highestbars(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      const series = Series.from(source);
      if (context.idx < length - 1) {
        return NaN;
      }
      let maxVal = -Infinity;
      let maxOffset = NaN;
      for (let i = 0; i < length; i++) {
        const val = series.get(i);
        if (isNaN(val)) continue;
        if (isNaN(maxOffset) || val > maxVal) {
          maxVal = val;
          maxOffset = -i;
        }
      }
      return maxOffset;
    };
  }

  function hma(context) {
    return (source, _period, _callId) => {
      const period = Series.from(_period).get(0);
      const halfPeriod = Math.floor(period / 2);
      const sqrtPeriod = Math.floor(Math.sqrt(period));
      const wmaFn = context.ta.wma;
      const wma1 = wmaFn(source, halfPeriod, _callId ? `${_callId}_wma1` : void 0);
      const wma2 = wmaFn(source, period, _callId ? `${_callId}_wma2` : void 0);
      if (isNaN(wma1) || isNaN(wma2)) {
        return NaN;
      }
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `hma_raw_${period}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevValues: [],
          // Tentative state
          currentValues: []
        };
      }
      const rawState = context.taState[stateKey];
      if (context.idx > rawState.lastIdx) {
        if (rawState.lastIdx >= 0) {
          rawState.prevValues = [...rawState.currentValues];
        }
        rawState.lastIdx = context.idx;
      }
      const rawHma = 2 * wma1 - wma2;
      const values = [...rawState.prevValues];
      values.unshift(rawHma);
      if (values.length > sqrtPeriod + 1) values.pop();
      rawState.currentValues = values;
      const hmaStateKey = _callId ? `${_callId}_hma_final` : `hma_final_${period}`;
      if (!context.taState[hmaStateKey]) {
        context.taState[hmaStateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state
          currentWindow: []
        };
      }
      const state = context.taState[hmaStateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const window = [...state.prevWindow];
      window.unshift(rawHma);
      if (window.length < sqrtPeriod) {
        state.currentWindow = window;
        return NaN;
      }
      if (window.length > sqrtPeriod) {
        window.pop();
      }
      state.currentWindow = window;
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < sqrtPeriod; i++) {
        const weight = sqrtPeriod - i;
        numerator += window[i] * weight;
        denominator += weight;
      }
      const hma2 = numerator / denominator;
      return context.precision(hma2);
    };
  }

  function iii(context) {
    return (_callId) => {
      const close = context.get(context.data.close, 0);
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      const volume = context.get(context.data.volume, 0);
      if (isNaN(close) || isNaN(high) || isNaN(low) || isNaN(volume)) {
        return NaN;
      }
      const range = high - low;
      const denominator = range * volume;
      if (denominator === 0) {
        return context.precision(0);
      }
      const iii2 = (2 * close - high - low) / denominator;
      return context.precision(iii2);
    };
  }

  function kc(context) {
    return (source, _length, _mult, _useTrueRange, _callId) => {
      const length = Series.from(_length).get(0);
      const mult = Series.from(_mult).get(0);
      let useTrueRange = true;
      if (typeof _useTrueRange === "string") {
        _callId = _useTrueRange;
      } else if (_useTrueRange !== void 0) {
        useTrueRange = Series.from(_useTrueRange).get(0);
      }
      let span;
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      if (useTrueRange) {
        const close1 = context.get(context.data.close, 1);
        if (isNaN(close1)) {
          span = NaN;
        } else {
          span = Math.max(high - low, Math.abs(high - close1), Math.abs(low - close1));
        }
      } else {
        span = high - low;
      }
      const currentValue = Series.from(source).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `kc_${length}_${mult}_${useTrueRange}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          basisState: { prevEma: null, initSum: 0, initCount: 0 },
          rangeState: { prevEma: null, initSum: 0, initCount: 0 },
          // Tentative state
          currentBasisState: { prevEma: null, initSum: 0, initCount: 0 },
          currentRangeState: { prevEma: null, initSum: 0, initCount: 0 }
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.basisState = { ...state.currentBasisState };
          state.rangeState = { ...state.currentRangeState };
        }
        state.lastIdx = context.idx;
      }
      const updateEma = (committedState, tentativeState, value, period) => {
        if (isNaN(value)) {
          Object.assign(tentativeState, committedState);
          return tentativeState.prevEma !== null ? tentativeState.prevEma : NaN;
        }
        let initCount = committedState.initCount;
        let initSum = committedState.initSum;
        let prevEma = committedState.prevEma;
        if (initCount < period) {
          initSum += value;
          initCount++;
          tentativeState.initSum = initSum;
          tentativeState.initCount = initCount;
          tentativeState.prevEma = prevEma;
          if (initCount === period) {
            const ema2 = initSum / period;
            tentativeState.prevEma = ema2;
            return ema2;
          }
          return NaN;
        }
        const alpha = 2 / (period + 1);
        const ema = value * alpha + prevEma * (1 - alpha);
        tentativeState.prevEma = ema;
        tentativeState.initSum = initSum;
        tentativeState.initCount = initCount;
        return ema;
      };
      const basis = updateEma(state.basisState, state.currentBasisState, currentValue, length);
      const rangeEma = updateEma(state.rangeState, state.currentRangeState, span, length);
      if (isNaN(basis) || isNaN(rangeEma)) {
        return [[NaN, NaN, NaN]];
      }
      const upper = basis + rangeEma * mult;
      const lower = basis - rangeEma * mult;
      return [[context.precision(basis), context.precision(upper), context.precision(lower)]];
    };
  }

  function kcw(context) {
    return (source, _length, _mult, _useTrueRange, _callId) => {
      const length = Series.from(_length).get(0);
      const mult = Series.from(_mult).get(0);
      let useTrueRange = true;
      if (typeof _useTrueRange === "string") {
        _callId = _useTrueRange;
      } else if (_useTrueRange !== void 0) {
        useTrueRange = Series.from(_useTrueRange).get(0);
      }
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `kcw_${length}_${mult}_${useTrueRange}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          basisState: { prevEma: null, initSum: 0, initCount: 0 },
          rangeState: { prevEma: null, initSum: 0, initCount: 0 },
          // Tentative state
          currentBasisState: { prevEma: null, initSum: 0, initCount: 0 },
          currentRangeState: { prevEma: null, initSum: 0, initCount: 0 }
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.basisState = { ...state.currentBasisState };
          state.rangeState = { ...state.currentRangeState };
        }
        state.lastIdx = context.idx;
      }
      const updateEma = (committedState, tentativeState, value, period) => {
        if (isNaN(value)) {
          Object.assign(tentativeState, committedState);
          return tentativeState.prevEma !== null ? tentativeState.prevEma : NaN;
        }
        let initCount = committedState.initCount;
        let initSum = committedState.initSum;
        let prevEma = committedState.prevEma;
        if (initCount < period) {
          initSum += value;
          initCount++;
          tentativeState.initSum = initSum;
          tentativeState.initCount = initCount;
          tentativeState.prevEma = prevEma;
          if (initCount === period) {
            const ema2 = initSum / period;
            tentativeState.prevEma = ema2;
            return ema2;
          }
          return NaN;
        }
        const alpha = 2 / (period + 1);
        const ema = value * alpha + prevEma * (1 - alpha);
        tentativeState.prevEma = ema;
        tentativeState.initSum = initSum;
        tentativeState.initCount = initCount;
        return ema;
      };
      let span;
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      if (useTrueRange) {
        const close1 = context.get(context.data.close, 1);
        if (isNaN(close1)) {
          span = NaN;
        } else {
          span = Math.max(high - low, Math.abs(high - close1), Math.abs(low - close1));
        }
      } else {
        span = high - low;
      }
      const currentValue = Series.from(source).get(0);
      const basis = updateEma(state.basisState, state.currentBasisState, currentValue, length);
      const rangeEma = updateEma(state.rangeState, state.currentRangeState, span, length);
      if (isNaN(basis) || isNaN(rangeEma)) {
        return NaN;
      }
      if (basis === 0) {
        return context.precision(0);
      }
      const kcw2 = 2 * rangeEma * mult / basis;
      return context.precision(kcw2);
    };
  }

  function linreg(context) {
    return (source, _length, _offset, _callId) => {
      const length = Series.from(_length).get(0);
      const offset = Series.from(_offset).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `linreg_${length}_${offset}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state
          currentWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const window = [...state.prevWindow];
      window.unshift(currentValue);
      if (window.length > length) {
        window.pop();
      }
      state.currentWindow = window;
      if (window.length < length) {
        return NaN;
      }
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
      const n = length;
      for (let j = 0; j < length; j++) {
        const x = length - 1 - j;
        const y = window[j];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      }
      const denominator = n * sumXX - sumX * sumX;
      if (denominator === 0) {
        return NaN;
      }
      const slope = (n * sumXY - sumX * sumY) / denominator;
      const intercept = (sumY - slope * sumX) / n;
      const linRegValue = intercept + slope * (length - 1 - offset);
      return context.precision(linRegValue);
    };
  }

  function lowest(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `lowest_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state
          currentWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const window = [...state.prevWindow];
      window.unshift(currentValue);
      if (window.length < length) {
        state.currentWindow = window;
        return NaN;
      }
      if (window.length > length) {
        window.pop();
      }
      state.currentWindow = window;
      const validValues = window.filter((v) => !isNaN(v) && v !== void 0);
      const min = validValues.length > 0 ? Math.min(...validValues) : NaN;
      return context.precision(min);
    };
  }

  function lowestbars(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      const series = Series.from(source);
      if (context.idx < length - 1) {
        return NaN;
      }
      let minVal = Infinity;
      let minOffset = NaN;
      for (let i = 0; i < length; i++) {
        const val = series.get(i);
        if (isNaN(val)) continue;
        if (isNaN(minOffset) || val < minVal) {
          minVal = val;
          minOffset = -i;
        }
      }
      return minOffset;
    };
  }

  function macd(context) {
    return (source, _fastLength, _slowLength, _signalLength, _callId) => {
      const fastLength = Series.from(_fastLength).get(0);
      const slowLength = Series.from(_slowLength).get(0);
      const signalLength = Series.from(_signalLength).get(0);
      const baseId = _callId || `macd_${fastLength}_${slowLength}_${signalLength}`;
      const fastEmaId = `${baseId}_fast`;
      const slowEmaId = `${baseId}_slow`;
      const signalEmaId = `${baseId}_signal`;
      const fastMA = context.ta.ema(source, fastLength, fastEmaId);
      const slowMA = context.ta.ema(source, slowLength, slowEmaId);
      let macdLine = NaN;
      if (!isNaN(fastMA) && !isNaN(slowMA)) {
        macdLine = fastMA - slowMA;
      }
      let signalLine = NaN;
      if (!isNaN(macdLine)) {
        signalLine = context.ta.ema(macdLine, signalLength, signalEmaId);
      }
      let histLine = NaN;
      if (!isNaN(macdLine) && !isNaN(signalLine)) {
        histLine = macdLine - signalLine;
      }
      return [[context.precision(macdLine), context.precision(signalLine), context.precision(histLine)]];
    };
  }

  function median(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `median_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state
          currentWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const window = [...state.prevWindow];
      window.unshift(currentValue);
      if (window.length > length) {
        window.pop();
      }
      state.currentWindow = window;
      if (window.length < length) {
        return NaN;
      }
      const sorted = window.slice().sort((a, b) => a - b);
      const mid = Math.floor(length / 2);
      const median2 = length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      return context.precision(median2);
    };
  }

  function mfi(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `mfi_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevUpperWindow: [],
          prevLowerWindow: [],
          prevUpperSum: 0,
          prevLowerSum: 0,
          // Tentative state
          currentUpperWindow: [],
          currentLowerWindow: [],
          currentUpperSum: 0,
          currentLowerSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevUpperWindow = [...state.currentUpperWindow];
          state.prevLowerWindow = [...state.currentLowerWindow];
          state.prevUpperSum = state.currentUpperSum;
          state.prevLowerSum = state.currentLowerSum;
        }
        state.lastIdx = context.idx;
      }
      const currentSrc = Series.from(source).get(0);
      const previousSrc = Series.from(source).get(1);
      const volume = context.get(context.data.volume, 0);
      if (isNaN(currentSrc) || isNaN(volume)) {
        return NaN;
      }
      const change = isNaN(previousSrc) ? NaN : currentSrc - previousSrc;
      const upperComponent = volume * (change <= 0 ? 0 : currentSrc);
      const lowerComponent = volume * (change >= 0 ? 0 : currentSrc);
      const upperWindow = [...state.prevUpperWindow];
      const lowerWindow = [...state.prevLowerWindow];
      let upperSum = state.prevUpperSum;
      let lowerSum = state.prevLowerSum;
      upperWindow.unshift(upperComponent);
      lowerWindow.unshift(lowerComponent);
      upperSum += upperComponent;
      lowerSum += lowerComponent;
      if (upperWindow.length < length) {
        state.currentUpperWindow = upperWindow;
        state.currentLowerWindow = lowerWindow;
        state.currentUpperSum = upperSum;
        state.currentLowerSum = lowerSum;
        return NaN;
      }
      if (upperWindow.length > length) {
        const oldUpper = upperWindow.pop();
        const oldLower = lowerWindow.pop();
        upperSum -= oldUpper;
        lowerSum -= oldLower;
      }
      state.currentUpperWindow = upperWindow;
      state.currentLowerWindow = lowerWindow;
      state.currentUpperSum = upperSum;
      state.currentLowerSum = lowerSum;
      if (lowerSum === 0) {
        if (upperSum === 0) {
          return context.precision(100);
        }
        return context.precision(100);
      }
      if (upperSum === 0) {
        return context.precision(0);
      }
      const mfi2 = 100 - 100 / (1 + upperSum / lowerSum);
      return context.precision(mfi2);
    };
  }

  function mode(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      const series = Series.from(source);
      if (context.idx < length - 1) {
        return NaN;
      }
      const counts = /* @__PURE__ */ new Map();
      for (let i = 0; i < length; i++) {
        const val = series.get(i);
        if (isNaN(val)) continue;
        counts.set(val, (counts.get(val) || 0) + 1);
      }
      if (counts.size === 0) return NaN;
      let modeVal = NaN;
      let maxFreq = -1;
      for (const [val, freq] of counts.entries()) {
        if (freq > maxFreq) {
          maxFreq = freq;
          modeVal = val;
        } else if (freq === maxFreq) {
          if (val < modeVal) {
            modeVal = val;
          }
        }
      }
      return modeVal;
    };
  }

  function mom(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      return context.ta.change(source, length, _callId);
    };
  }

  function nvi(context) {
    return (_callId) => {
      if (!context.taState) context.taState = {};
      const stateKey = _callId || "nvi";
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed NVI
          committedNVI: 1,
          // Tentative NVI
          tentativeNVI: 1
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.committedNVI = state.tentativeNVI;
        }
        state.lastIdx = context.idx;
      }
      const close = context.get(context.data.close, 0);
      const prevClose = context.get(context.data.close, 1);
      const volume = context.get(context.data.volume, 0);
      const prevVolume = context.get(context.data.volume, 1);
      const c0 = isNaN(close) ? 0 : close;
      const c1 = isNaN(prevClose) ? 0 : prevClose;
      const v0 = isNaN(volume) ? 0 : volume;
      const v1 = isNaN(prevVolume) ? 0 : prevVolume;
      let currentNVI = state.committedNVI;
      if (c0 === 0 || c1 === 0) ; else {
        if (v0 < v1) {
          const change = (c0 - c1) / c1;
          currentNVI = currentNVI + change * currentNVI;
        }
      }
      state.tentativeNVI = currentNVI;
      return context.precision(currentNVI);
    };
  }

  function obv(context) {
    return () => {
      if (!context.taState) context.taState = {};
      const stateKey = "obv";
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed OBV (value at end of lastIdx)
          committedOBV: 0,
          // Tentative OBV (current value)
          tentativeOBV: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.committedOBV = state.tentativeOBV;
        }
        state.lastIdx = context.idx;
      }
      const close0 = context.get(context.data.close, 0);
      const volume0 = context.get(context.data.volume, 0);
      const close1 = context.get(context.data.close, 1);
      if (isNaN(close1)) {
        state.tentativeOBV = 0;
        return context.precision(0);
      }
      let currentOBV = state.committedOBV;
      if (close0 > close1) {
        currentOBV += volume0;
      } else if (close0 < close1) {
        currentOBV -= volume0;
      } else ;
      state.tentativeOBV = currentOBV;
      return context.precision(currentOBV);
    };
  }

  function param(context) {
    return (source, index, name) => {
      if (source instanceof Series) {
        if (index) {
          return new Series(source.data, source.offset + index);
        }
        return source;
      }
      if (!context.params[name]) context.params[name] = [];
      if (Array.isArray(source)) {
        return new Series(source, index || 0);
      } else {
        if (context.params[name].length === 0) {
          context.params[name].push(source);
        } else {
          context.params[name][context.params[name].length - 1] = source;
        }
        return new Series(context.params[name], 0);
      }
    };
  }

  function percentile_linear_interpolation(context) {
    return (source, _length, _percentage, _callId) => {
      const length = Series.from(_length).get(0);
      const percentage = Series.from(_percentage).get(0);
      const series = Series.from(source);
      if (context.idx < length - 1) {
        return NaN;
      }
      const values = [];
      for (let i = 0; i < length; i++) {
        const val = series.get(i);
        if (isNaN(val)) return NaN;
        values.push(val);
      }
      values.sort((a, b) => a - b);
      let index = percentage / 100 * length - 0.5;
      if (index < 0) index = 0;
      if (index > length - 1) index = length - 1;
      const lowerIndex = Math.floor(index);
      const upperIndex = Math.ceil(index);
      if (lowerIndex === upperIndex) {
        return context.precision(values[lowerIndex]);
      }
      const fraction = index - lowerIndex;
      const result = values[lowerIndex] + fraction * (values[upperIndex] - values[lowerIndex]);
      return context.precision(result);
    };
  }

  function percentile_nearest_rank(context) {
    return (source, _length, _percentage, _callId) => {
      const length = Series.from(_length).get(0);
      const percentage = Series.from(_percentage).get(0);
      const series = Series.from(source);
      if (context.idx < length - 1) {
        return NaN;
      }
      const values = [];
      for (let i = 0; i < length; i++) {
        const val = series.get(i);
        if (!isNaN(val)) {
          values.push(val);
        }
      }
      if (values.length === 0) return NaN;
      values.sort((a, b) => a - b);
      let index = Math.ceil(percentage / 100 * values.length) - 1;
      if (index < 0) index = 0;
      if (index >= values.length) index = values.length - 1;
      return context.precision(values[index]);
    };
  }

  function percentrank(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      const series = Series.from(source);
      if (context.idx < length) {
        return NaN;
      }
      const currentValue = series.get(0);
      if (isNaN(currentValue)) return NaN;
      let count = 0;
      let validValues = 0;
      for (let i = 1; i <= length; i++) {
        const val = series.get(i);
        if (isNaN(val)) continue;
        validValues++;
        if (val <= currentValue) {
          count++;
        }
      }
      if (validValues === 0) return NaN;
      return context.precision(count / validValues * 100);
    };
  }

  function pivothigh$1(source, leftbars, rightbars) {
    const result = new Array(source.length).fill(NaN);
    for (let i = leftbars + rightbars; i < source.length; i++) {
      const pivot = source[i - rightbars];
      let isPivot = true;
      for (let j = 1; j <= leftbars; j++) {
        if (source[i - rightbars - j] >= pivot) {
          isPivot = false;
          break;
        }
      }
      if (isPivot) {
        for (let j = 1; j <= rightbars; j++) {
          if (source[i - rightbars + j] >= pivot) {
            isPivot = false;
            break;
          }
        }
      }
      if (isPivot) {
        result[i] = pivot;
      }
    }
    return result;
  }

  function pivothigh(context) {
    return (source, _leftbars, _rightbars, _callId) => {
      if (typeof _rightbars === "string") {
        _rightbars = _leftbars;
        _leftbars = source;
        source = context.data.high;
      }
      const leftbars = Series.from(_leftbars).get(0);
      const rightbars = Series.from(_rightbars).get(0);
      const sourceArray = Series.from(source).toArray();
      const result = pivothigh$1(sourceArray, leftbars, rightbars);
      const idx = context.idx;
      return context.precision(result[idx]);
    };
  }

  function pivotlow$1(source, leftbars, rightbars) {
    const result = new Array(source.length).fill(NaN);
    for (let i = leftbars + rightbars; i < source.length; i++) {
      const pivot = source[i - rightbars];
      let isPivot = true;
      for (let j = 1; j <= leftbars; j++) {
        if (source[i - rightbars - j] <= pivot) {
          isPivot = false;
          break;
        }
      }
      if (isPivot) {
        for (let j = 1; j <= rightbars; j++) {
          if (source[i - rightbars + j] <= pivot) {
            isPivot = false;
            break;
          }
        }
      }
      if (isPivot) {
        result[i] = pivot;
      }
    }
    return result;
  }

  function pivotlow(context) {
    return (source, _leftbars, _rightbars, _callId) => {
      if (typeof _rightbars === "string") {
        _rightbars = _leftbars;
        _leftbars = source;
        source = context.data.low;
      }
      const leftbars = Series.from(_leftbars).get(0);
      const rightbars = Series.from(_rightbars).get(0);
      const sourceArray = Series.from(source).toArray();
      const result = pivotlow$1(sourceArray, leftbars, rightbars);
      const idx = context.idx;
      return context.precision(result[idx]);
    };
  }

  function pvi(context) {
    return (_callId) => {
      if (!context.taState) context.taState = {};
      const stateKey = _callId || "pvi";
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed PVI
          committedPVI: 1,
          // Tentative PVI
          tentativePVI: 1
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.committedPVI = state.tentativePVI;
        }
        state.lastIdx = context.idx;
      }
      const close = context.get(context.data.close, 0);
      const prevClose = context.get(context.data.close, 1);
      const volume = context.get(context.data.volume, 0);
      const prevVolume = context.get(context.data.volume, 1);
      const c0 = isNaN(close) ? 0 : close;
      const c1 = isNaN(prevClose) ? 0 : prevClose;
      const v0 = isNaN(volume) ? 0 : volume;
      const v1 = isNaN(prevVolume) ? 0 : prevVolume;
      let currentPVI = state.committedPVI;
      if (c0 === 0 || c1 === 0) ; else {
        if (v0 > v1) {
          const change = (c0 - c1) / c1;
          currentPVI = currentPVI + change * currentPVI;
        }
      }
      state.tentativePVI = currentPVI;
      return context.precision(currentPVI);
    };
  }

  function pvt(context) {
    return (_callId) => {
      if (!context.taState) context.taState = {};
      const stateKey = _callId || "pvt";
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevCumulativeSum: 0,
          // Tentative state
          currentCumulativeSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevCumulativeSum = state.currentCumulativeSum;
        }
        state.lastIdx = context.idx;
      }
      const close = context.get(context.data.close, 0);
      const prevClose = context.get(context.data.close, 1);
      const volume = context.get(context.data.volume, 0);
      let currentSum = state.prevCumulativeSum;
      if (!isNaN(close) && !isNaN(prevClose) && !isNaN(volume) && prevClose !== 0) {
        const term = (close - prevClose) / prevClose * volume;
        currentSum += term;
      }
      state.currentCumulativeSum = currentSum;
      return context.precision(currentSum);
    };
  }

  function range(context) {
    return (source, _length, _callId) => {
      const h = context.pine.ta.highest(source, _length, (_callId || "range") + "_h");
      const l = context.pine.ta.lowest(source, _length, (_callId || "range") + "_l");
      if (isNaN(h) || isNaN(l)) {
        return NaN;
      }
      return context.precision(h - l);
    };
  }

  function rising(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      const series = Series.from(source);
      for (let i = 0; i < length; i++) {
        const current = series.get(i);
        const next = series.get(i + 1);
        if (isNaN(current) || isNaN(next)) {
          return false;
        }
        if (current <= next) {
          return false;
        }
      }
      return true;
    };
  }

  function rma(context) {
    return (source, _period, _callId) => {
      const period = Series.from(_period).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `rma_${period}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevRma: null,
          prevInitSum: 0,
          prevInitCount: 0,
          // Tentative state
          currentRma: null,
          currentInitSum: 0,
          currentInitCount: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevRma = state.currentRma;
          state.prevInitSum = state.currentInitSum;
          state.prevInitCount = state.currentInitCount;
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0) || 0;
      let initCount = state.prevInitCount;
      let initSum = state.prevInitSum;
      let prevRma = state.prevRma;
      if (initCount < period) {
        initSum += currentValue;
        initCount++;
        state.currentInitSum = initSum;
        state.currentInitCount = initCount;
        if (initCount === period) {
          const rma3 = initSum / period;
          state.currentRma = rma3;
          return context.precision(rma3);
        }
        return NaN;
      }
      const alpha = 1 / period;
      const rma2 = currentValue * alpha + prevRma * (1 - alpha);
      state.currentRma = rma2;
      return context.precision(rma2);
    };
  }

  function roc(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `roc_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state
          currentWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const window = [...state.prevWindow];
      window.unshift(currentValue);
      if (window.length <= length) {
        state.currentWindow = window;
        return NaN;
      }
      if (window.length > length + 1) {
        window.pop();
      }
      state.currentWindow = window;
      const prevValue = window[length];
      const roc2 = (currentValue - prevValue) / prevValue * 100;
      return context.precision(roc2);
    };
  }

  function rsi(context) {
    return (source, _period, _callId) => {
      const period = Series.from(_period).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `rsi_${period}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevPrevValue: null,
          prevAvgGain: 0,
          prevAvgLoss: 0,
          prevInitGains: [],
          prevInitLosses: [],
          // Tentative state
          currentPrevValue: null,
          currentAvgGain: 0,
          currentAvgLoss: 0,
          currentInitGains: [],
          currentInitLosses: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevPrevValue = state.currentPrevValue;
          state.prevAvgGain = state.currentAvgGain;
          state.prevAvgLoss = state.currentAvgLoss;
          state.prevInitGains = [...state.currentInitGains];
          state.prevInitLosses = [...state.currentInitLosses];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const prevValue = state.prevPrevValue;
      let avgGain = state.prevAvgGain;
      let avgLoss = state.prevAvgLoss;
      const initGains = [...state.prevInitGains];
      const initLosses = [...state.prevInitLosses];
      if (prevValue !== null) {
        const diff = currentValue - prevValue;
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        if (initGains.length < period) {
          initGains.push(gain);
          initLosses.push(loss);
          state.currentInitGains = initGains;
          state.currentInitLosses = initLosses;
          state.currentPrevValue = currentValue;
          if (initGains.length === period) {
            avgGain = initGains.reduce((a, b) => a + b, 0) / period;
            avgLoss = initLosses.reduce((a, b) => a + b, 0) / period;
            state.currentAvgGain = avgGain;
            state.currentAvgLoss = avgLoss;
            const rsi3 = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
            return context.precision(rsi3);
          }
          return NaN;
        }
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        state.currentAvgGain = avgGain;
        state.currentAvgLoss = avgLoss;
        state.currentPrevValue = currentValue;
        const rsi2 = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
        return context.precision(rsi2);
      }
      state.currentPrevValue = currentValue;
      state.currentInitGains = [];
      state.currentInitLosses = [];
      return NaN;
    };
  }

  function sar(context) {
    return (_start, _inc, _max, _callId) => {
      const start = Series.from(_start).get(0);
      const inc = Series.from(_inc).get(0);
      const max = Series.from(_max).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `sar_${start}_${inc}_${max}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevResult: NaN,
          prevMaxMin: NaN,
          prevAcceleration: NaN,
          prevIsBelow: false,
          prevBarIndex: 0,
          // Tentative state
          currentResult: NaN,
          currentMaxMin: NaN,
          currentAcceleration: NaN,
          currentIsBelow: false,
          currentBarIndex: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevResult = state.currentResult;
          state.prevMaxMin = state.currentMaxMin;
          state.prevAcceleration = state.currentAcceleration;
          state.prevIsBelow = state.currentIsBelow;
          state.prevBarIndex = state.currentBarIndex;
        }
        state.lastIdx = context.idx;
      }
      let result = state.prevResult;
      let maxMin = state.prevMaxMin;
      let acceleration = state.prevAcceleration;
      let isBelow = state.prevIsBelow;
      let barIndex = state.prevBarIndex;
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      const close = context.get(context.data.close, 0);
      const prevClose = context.get(context.data.close, 1);
      const prevHigh = context.get(context.data.high, 1);
      const prevLow = context.get(context.data.low, 1);
      const prevHigh2 = context.get(context.data.high, 2);
      const prevLow2 = context.get(context.data.low, 2);
      if (isNaN(high) || isNaN(low) || isNaN(close)) {
        state.currentResult = result;
        state.currentMaxMin = maxMin;
        state.currentAcceleration = acceleration;
        state.currentIsBelow = isBelow;
        state.currentBarIndex = barIndex;
        return NaN;
      }
      let isFirstTrendBar = false;
      if (barIndex === 1) {
        if (close > prevClose) {
          isBelow = true;
          maxMin = high;
          result = prevLow;
        } else {
          isBelow = false;
          maxMin = low;
          result = prevHigh;
        }
        isFirstTrendBar = true;
        acceleration = start;
      }
      if (barIndex >= 1) {
        result = result + acceleration * (maxMin - result);
        if (isBelow) {
          if (result > low) {
            isFirstTrendBar = true;
            isBelow = false;
            result = Math.max(high, maxMin);
            maxMin = low;
            acceleration = start;
          }
        } else {
          if (result < high) {
            isFirstTrendBar = true;
            isBelow = true;
            result = Math.min(low, maxMin);
            maxMin = high;
            acceleration = start;
          }
        }
        if (!isFirstTrendBar) {
          if (isBelow) {
            if (high > maxMin) {
              maxMin = high;
              acceleration = Math.min(acceleration + inc, max);
            }
          } else {
            if (low < maxMin) {
              maxMin = low;
              acceleration = Math.min(acceleration + inc, max);
            }
          }
        }
        if (isBelow) {
          result = Math.min(result, prevLow);
          if (barIndex > 1) {
            result = Math.min(result, prevLow2);
          }
        } else {
          result = Math.max(result, prevHigh);
          if (barIndex > 1) {
            result = Math.max(result, prevHigh2);
          }
        }
      }
      barIndex++;
      state.currentResult = result;
      state.currentMaxMin = maxMin;
      state.currentAcceleration = acceleration;
      state.currentIsBelow = isBelow;
      state.currentBarIndex = barIndex;
      if (barIndex <= 1) {
        return NaN;
      }
      return context.precision(result);
    };
  }

  function sma(context) {
    return (source, _period, _callId) => {
      const period = Series.from(_period).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `sma_${period}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          prevSum: 0,
          // Tentative state
          currentWindow: [],
          currentSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
          state.prevSum = state.currentSum;
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0) || 0;
      const window = [...state.prevWindow];
      let sum = state.prevSum;
      window.unshift(currentValue);
      sum += currentValue;
      if (window.length < period) {
        state.currentWindow = window;
        state.currentSum = sum;
        return NaN;
      }
      if (window.length > period) {
        const oldValue = window.pop();
        sum -= oldValue;
      }
      state.currentWindow = window;
      state.currentSum = sum;
      const sma2 = sum / period;
      return context.precision(sma2);
    };
  }

  function stdev(context) {
    return (source, _length, _bias = true, _callId) => {
      const length = Series.from(_length).get(0);
      const bias = Series.from(_bias).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `stdev_${length}_${bias}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          prevSum: 0,
          // Tentative state
          currentWindow: [],
          currentSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
          state.prevSum = state.currentSum;
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      if (currentValue === null || currentValue === void 0 || isNaN(currentValue)) {
        return NaN;
      }
      const window = [...state.prevWindow];
      let sum = state.prevSum;
      window.unshift(currentValue);
      sum += currentValue;
      if (window.length < length) {
        state.currentWindow = window;
        state.currentSum = sum;
        return NaN;
      }
      if (window.length > length) {
        const oldValue = window.pop();
        sum -= oldValue;
      }
      state.currentWindow = window;
      state.currentSum = sum;
      const mean = sum / length;
      let sumSquaredDiff = 0;
      for (let i = 0; i < length; i++) {
        sumSquaredDiff += Math.pow(window[i] - mean, 2);
      }
      const divisor = bias ? length : length - 1;
      const stdev2 = Math.sqrt(sumSquaredDiff / divisor);
      return context.precision(stdev2);
    };
  }

  function stoch(context) {
    return (source, high, low, _length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `stoch_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevHighWindow: [],
          prevLowWindow: [],
          // Tentative state
          currentHighWindow: [],
          currentLowWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevHighWindow = [...state.currentHighWindow];
          state.prevLowWindow = [...state.currentLowWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentSource = Series.from(source).get(0);
      const currentHigh = Series.from(high).get(0);
      const currentLow = Series.from(low).get(0);
      if (isNaN(currentSource) || isNaN(currentHigh) || isNaN(currentLow)) {
        state.currentHighWindow = [...state.prevHighWindow];
        state.currentLowWindow = [...state.prevLowWindow];
        return NaN;
      }
      const highWindow = [...state.prevHighWindow];
      const lowWindow = [...state.prevLowWindow];
      highWindow.unshift(currentHigh);
      lowWindow.unshift(currentLow);
      if (highWindow.length > length) {
        highWindow.pop();
        lowWindow.pop();
      }
      state.currentHighWindow = highWindow;
      state.currentLowWindow = lowWindow;
      if (highWindow.length < length) {
        return NaN;
      }
      let highest = highWindow[0];
      let lowest = lowWindow[0];
      for (let i = 1; i < length; i++) {
        if (highWindow[i] > highest) {
          highest = highWindow[i];
        }
        if (lowWindow[i] < lowest) {
          lowest = lowWindow[i];
        }
      }
      const range = highest - lowest;
      if (range === 0) {
        return NaN;
      }
      const stochastic = 100 * (currentSource - lowest) / range;
      return context.precision(stochastic);
    };
  }

  function supertrend(context) {
    return (_factor, _atrPeriod, _callId) => {
      const factor = Series.from(_factor).get(0);
      const atrPeriod = Series.from(_atrPeriod).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `supertrend_${factor}_${atrPeriod}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevTrSum: 0,
          prevAtrValue: NaN,
          prevAtrCount: 0,
          prevLowerBand: NaN,
          prevUpperBand: NaN,
          prevSuperTrend: NaN,
          prevDirection: NaN,
          prevClose: NaN,
          // Tentative state
          currentTrSum: 0,
          currentAtrValue: NaN,
          currentAtrCount: 0,
          currentLowerBand: NaN,
          currentUpperBand: NaN,
          currentSuperTrend: NaN,
          currentDirection: NaN,
          currentClose: NaN
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevTrSum = state.currentTrSum;
          state.prevAtrValue = state.currentAtrValue;
          state.prevAtrCount = state.currentAtrCount;
          state.prevLowerBand = state.currentLowerBand;
          state.prevUpperBand = state.currentUpperBand;
          state.prevSuperTrend = state.currentSuperTrend;
          state.prevDirection = state.currentDirection;
          state.prevClose = state.currentClose;
        }
        state.lastIdx = context.idx;
      }
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      const close = context.get(context.data.close, 0);
      if (isNaN(high) || isNaN(low) || isNaN(close)) {
        return [[NaN, NaN]];
      }
      const hl2 = (high + low) / 2;
      const prevClose = state.prevClose;
      let tr;
      if (isNaN(prevClose)) {
        tr = high - low;
      } else {
        tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      }
      let atrCount = state.prevAtrCount;
      let trSum = state.prevTrSum;
      let atrValue = state.prevAtrValue;
      atrCount++;
      if (atrCount <= atrPeriod) {
        trSum += tr;
        if (atrCount === atrPeriod) {
          atrValue = trSum / atrPeriod;
        }
      } else {
        atrValue = (atrValue * (atrPeriod - 1) + tr) / atrPeriod;
      }
      const atr = atrValue;
      state.currentAtrCount = atrCount;
      state.currentTrSum = trSum;
      state.currentAtrValue = atrValue;
      state.currentClose = close;
      if (isNaN(atr)) {
        return [[NaN, NaN]];
      }
      let upperBand = hl2 + factor * atr;
      let lowerBand = hl2 - factor * atr;
      const prevLowerBand = isNaN(state.prevLowerBand) ? 0 : state.prevLowerBand;
      const prevUpperBand = isNaN(state.prevUpperBand) ? 0 : state.prevUpperBand;
      if (!isNaN(state.prevLowerBand)) {
        if (lowerBand > prevLowerBand || prevClose < prevLowerBand) ; else {
          lowerBand = prevLowerBand;
        }
      }
      if (!isNaN(state.prevUpperBand)) {
        if (upperBand < prevUpperBand || prevClose > prevUpperBand) ; else {
          upperBand = prevUpperBand;
        }
      }
      let direction;
      let superTrend;
      const prevSuperTrend = state.prevSuperTrend;
      if (atrCount === atrPeriod) {
        direction = 1;
      } else if (prevSuperTrend === state.prevUpperBand) {
        direction = close > upperBand ? -1 : 1;
      } else {
        direction = close < lowerBand ? 1 : -1;
      }
      superTrend = direction === -1 ? lowerBand : upperBand;
      state.currentLowerBand = lowerBand;
      state.currentUpperBand = upperBand;
      state.currentSuperTrend = superTrend;
      state.currentDirection = direction;
      return [[context.precision(superTrend), direction]];
    };
  }

  function swma(context) {
    return (source, _callId) => {
      const period = 4;
      const weights = [1, 2, 2, 1];
      const weightSum = 6;
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `swma`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state
          currentWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const window = [...state.prevWindow];
      window.unshift(currentValue);
      if (window.length < period) {
        state.currentWindow = window;
        return NaN;
      }
      if (window.length > period) {
        window.pop();
      }
      state.currentWindow = window;
      let swma2 = 0;
      for (let i = 0; i < period; i++) {
        swma2 += weights[i] * window[period - 1 - i];
      }
      swma2 /= weightSum;
      return context.precision(swma2);
    };
  }

  function tr(context) {
    return (handle_na, _callId) => {
      let handleNa = true;
      if (typeof handle_na === "string") ; else if (handle_na !== void 0) {
        handleNa = Series.from(handle_na).get(0);
      }
      const high0 = context.get(context.data.high, 0);
      const low0 = context.get(context.data.low, 0);
      const close1 = context.get(context.data.close, 1);
      if (isNaN(close1)) {
        return handleNa ? context.precision(high0 - low0) : NaN;
      }
      const val = Math.max(high0 - low0, Math.abs(high0 - close1), Math.abs(low0 - close1));
      return context.precision(val);
    };
  }

  function tsi(context) {
    return (source, _shortLength, _longLength, _callId) => {
      const shortLength = Series.from(_shortLength).get(0);
      const longLength = Series.from(_longLength).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `tsi_${shortLength}_${longLength}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevSource: NaN,
          prevEma1PcValue: NaN,
          prevEma1PcCount: 0,
          prevEma1PcSum: 0,
          prevEma2PcValue: NaN,
          prevEma2PcCount: 0,
          prevEma2PcSum: 0,
          prevEma1AbsValue: NaN,
          prevEma1AbsCount: 0,
          prevEma1AbsSum: 0,
          prevEma2AbsValue: NaN,
          prevEma2AbsCount: 0,
          prevEma2AbsSum: 0,
          // Tentative state
          currentSource: NaN,
          currentEma1PcValue: NaN,
          currentEma1PcCount: 0,
          currentEma1PcSum: 0,
          currentEma2PcValue: NaN,
          currentEma2PcCount: 0,
          currentEma2PcSum: 0,
          currentEma1AbsValue: NaN,
          currentEma1AbsCount: 0,
          currentEma1AbsSum: 0,
          currentEma2AbsValue: NaN,
          currentEma2AbsCount: 0,
          currentEma2AbsSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevSource = state.currentSource;
          state.prevEma1PcValue = state.currentEma1PcValue;
          state.prevEma1PcCount = state.currentEma1PcCount;
          state.prevEma1PcSum = state.currentEma1PcSum;
          state.prevEma2PcValue = state.currentEma2PcValue;
          state.prevEma2PcCount = state.currentEma2PcCount;
          state.prevEma2PcSum = state.currentEma2PcSum;
          state.prevEma1AbsValue = state.currentEma1AbsValue;
          state.prevEma1AbsCount = state.currentEma1AbsCount;
          state.prevEma1AbsSum = state.currentEma1AbsSum;
          state.prevEma2AbsValue = state.currentEma2AbsValue;
          state.prevEma2AbsCount = state.currentEma2AbsCount;
          state.prevEma2AbsSum = state.currentEma2AbsSum;
        }
        state.lastIdx = context.idx;
      }
      const currentSource = Series.from(source).get(0);
      if (isNaN(currentSource)) {
        return NaN;
      }
      const pc = isNaN(state.prevSource) ? NaN : currentSource - state.prevSource;
      state.currentSource = currentSource;
      if (isNaN(pc)) {
        return NaN;
      }
      const absPC = Math.abs(pc);
      const ema1PcMultiplier = 2 / (longLength + 1);
      const ema2PcMultiplier = 2 / (shortLength + 1);
      const ema1AbsMultiplier = 2 / (longLength + 1);
      const ema2AbsMultiplier = 2 / (shortLength + 1);
      let ema1PcCount = state.prevEma1PcCount;
      let ema1PcSum = state.prevEma1PcSum;
      let ema1PcValue = state.prevEma1PcValue;
      ema1PcCount++;
      if (ema1PcCount <= longLength) {
        ema1PcSum += pc;
        if (ema1PcCount === longLength) {
          ema1PcValue = ema1PcSum / longLength;
        }
      } else {
        ema1PcValue = pc * ema1PcMultiplier + ema1PcValue * (1 - ema1PcMultiplier);
      }
      let ema1AbsCount = state.prevEma1AbsCount;
      let ema1AbsSum = state.prevEma1AbsSum;
      let ema1AbsValue = state.prevEma1AbsValue;
      ema1AbsCount++;
      if (ema1AbsCount <= longLength) {
        ema1AbsSum += absPC;
        if (ema1AbsCount === longLength) {
          ema1AbsValue = ema1AbsSum / longLength;
        }
      } else {
        ema1AbsValue = absPC * ema1AbsMultiplier + ema1AbsValue * (1 - ema1AbsMultiplier);
      }
      if (isNaN(ema1PcValue) || isNaN(ema1AbsValue)) {
        state.currentEma1PcCount = ema1PcCount;
        state.currentEma1PcSum = ema1PcSum;
        state.currentEma1PcValue = ema1PcValue;
        state.currentEma1AbsCount = ema1AbsCount;
        state.currentEma1AbsSum = ema1AbsSum;
        state.currentEma1AbsValue = ema1AbsValue;
        return NaN;
      }
      let ema2PcCount = state.prevEma2PcCount;
      let ema2PcSum = state.prevEma2PcSum;
      let ema2PcValue = state.prevEma2PcValue;
      ema2PcCount++;
      if (ema2PcCount <= shortLength) {
        ema2PcSum += ema1PcValue;
        if (ema2PcCount === shortLength) {
          ema2PcValue = ema2PcSum / shortLength;
        }
      } else {
        ema2PcValue = ema1PcValue * ema2PcMultiplier + ema2PcValue * (1 - ema2PcMultiplier);
      }
      let ema2AbsCount = state.prevEma2AbsCount;
      let ema2AbsSum = state.prevEma2AbsSum;
      let ema2AbsValue = state.prevEma2AbsValue;
      ema2AbsCount++;
      if (ema2AbsCount <= shortLength) {
        ema2AbsSum += ema1AbsValue;
        if (ema2AbsCount === shortLength) {
          ema2AbsValue = ema2AbsSum / shortLength;
        }
      } else {
        ema2AbsValue = ema1AbsValue * ema2AbsMultiplier + ema2AbsValue * (1 - ema2AbsMultiplier);
      }
      state.currentEma1PcCount = ema1PcCount;
      state.currentEma1PcSum = ema1PcSum;
      state.currentEma1PcValue = ema1PcValue;
      state.currentEma1AbsCount = ema1AbsCount;
      state.currentEma1AbsSum = ema1AbsSum;
      state.currentEma1AbsValue = ema1AbsValue;
      state.currentEma2PcCount = ema2PcCount;
      state.currentEma2PcSum = ema2PcSum;
      state.currentEma2PcValue = ema2PcValue;
      state.currentEma2AbsCount = ema2AbsCount;
      state.currentEma2AbsSum = ema2AbsSum;
      state.currentEma2AbsValue = ema2AbsValue;
      if (isNaN(ema2PcValue) || isNaN(ema2AbsValue)) {
        return NaN;
      }
      if (ema2AbsValue === 0) {
        return context.precision(0);
      }
      const tsi2 = ema2PcValue / ema2AbsValue;
      return context.precision(tsi2);
    };
  }

  function valuewhen(context) {
    return (condition, source, _occurrence, _callId) => {
      if (!context.taState) context.taState = {};
      const stateKey = _callId || "valuewhen";
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevValues: [],
          // Tentative state
          currentValues: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevValues = [...state.currentValues];
        }
        state.lastIdx = context.idx;
      }
      const cond = Series.from(condition).get(0);
      const val = Series.from(source).get(0);
      const occurrence = Series.from(_occurrence).get(0);
      const values = [...state.prevValues];
      if (cond) {
        values.push(val);
      }
      state.currentValues = values;
      if (isNaN(occurrence) || occurrence < 0) {
        return NaN;
      }
      const index = values.length - 1 - occurrence;
      if (index < 0) {
        return NaN;
      }
      const result = values[index];
      if (typeof result === "number") {
        return context.precision(result);
      }
      return result;
    };
  }

  function variance(context) {
    return (source, _length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `variance_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state
          currentWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const window = [...state.prevWindow];
      window.unshift(currentValue);
      if (window.length > length) {
        window.pop();
      }
      state.currentWindow = window;
      if (window.length < length) {
        return NaN;
      }
      let sum = 0;
      let sumSquares = 0;
      for (let i = 0; i < length; i++) {
        sum += window[i];
        sumSquares += window[i] * window[i];
      }
      const mean = sum / length;
      const variance2 = sumSquares / length - mean * mean;
      return context.precision(variance2);
    };
  }

  function vwap(context) {
    return (source, _callId) => {
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `vwap`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevCumulativePV: 0,
          // Cumulative price * volume
          prevCumulativeVolume: 0,
          // Cumulative volume
          prevLastSessionDate: null,
          // Track last session date
          // Tentative state
          currentCumulativePV: 0,
          currentCumulativeVolume: 0,
          currentLastSessionDate: null
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevCumulativePV = state.currentCumulativePV;
          state.prevCumulativeVolume = state.currentCumulativeVolume;
          state.prevLastSessionDate = state.currentLastSessionDate;
        }
        state.lastIdx = context.idx;
      }
      const currentPrice = Series.from(source).get(0);
      const currentVolume = Series.from(context.data.volume).get(0);
      const currentOpenTime = Series.from(context.data.openTime).get(0);
      const currentDate = new Date(currentOpenTime);
      const currentSessionDate = currentDate.toISOString().slice(0, 10);
      let cumulativePV = state.prevCumulativePV;
      let cumulativeVolume = state.prevCumulativeVolume;
      let lastSessionDate = state.prevLastSessionDate;
      if (lastSessionDate !== currentSessionDate) {
        cumulativePV = 0;
        cumulativeVolume = 0;
        lastSessionDate = currentSessionDate;
      }
      cumulativePV += currentPrice * currentVolume;
      cumulativeVolume += currentVolume;
      state.currentCumulativePV = cumulativePV;
      state.currentCumulativeVolume = cumulativeVolume;
      state.currentLastSessionDate = lastSessionDate;
      if (cumulativeVolume === 0) {
        return NaN;
      }
      const vwap2 = cumulativePV / cumulativeVolume;
      return context.precision(vwap2);
    };
  }

  function vwma(context) {
    return (source, _period, _callId) => {
      const period = Series.from(_period).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `vwma_${period}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          prevVolumeWindow: [],
          // Tentative state
          currentWindow: [],
          currentVolumeWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
          state.prevVolumeWindow = [...state.currentVolumeWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const currentVolume = context.get(context.data.volume, 0);
      const window = [...state.prevWindow];
      const volumeWindow = [...state.prevVolumeWindow];
      window.unshift(currentValue);
      volumeWindow.unshift(currentVolume);
      if (window.length > period) {
        window.pop();
        volumeWindow.pop();
      }
      state.currentWindow = window;
      state.currentVolumeWindow = volumeWindow;
      if (window.length < period) {
        return NaN;
      }
      let sumVolPrice = 0;
      let sumVol = 0;
      for (let i = 0; i < period; i++) {
        sumVolPrice += window[i] * volumeWindow[i];
        sumVol += volumeWindow[i];
      }
      const vwma2 = sumVolPrice / sumVol;
      return context.precision(vwma2);
    };
  }

  function wad(context) {
    return (_callId) => {
      if (!context.taState) context.taState = {};
      const stateKey = _callId || "wad";
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevCumulativeSum: 0,
          // Tentative state
          currentCumulativeSum: 0
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevCumulativeSum = state.currentCumulativeSum;
        }
        state.lastIdx = context.idx;
      }
      const close = context.get(context.data.close, 0);
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      const prevClose = context.get(context.data.close, 1);
      if (isNaN(close) || isNaN(high) || isNaN(low)) {
        state.currentCumulativeSum = state.prevCumulativeSum;
        return context.precision(state.prevCumulativeSum);
      }
      let gain = 0;
      if (!isNaN(prevClose)) {
        const trueHigh = Math.max(high, prevClose);
        const trueLow = Math.min(low, prevClose);
        const mom = close - prevClose;
        if (mom > 0) {
          gain = close - trueLow;
        } else if (mom < 0) {
          gain = close - trueHigh;
        }
      }
      const currentSum = state.prevCumulativeSum + gain;
      state.currentCumulativeSum = currentSum;
      return context.precision(currentSum);
    };
  }

  function wma(context) {
    return (source, _period, _callId) => {
      const period = Series.from(_period).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `wma_${period}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevWindow: [],
          // Tentative state
          currentWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevWindow = [...state.currentWindow];
        }
        state.lastIdx = context.idx;
      }
      const currentValue = Series.from(source).get(0);
      const window = [...state.prevWindow];
      window.unshift(currentValue);
      if (window.length < period) {
        state.currentWindow = window;
        return NaN;
      }
      if (window.length > period) {
        window.pop();
      }
      state.currentWindow = window;
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < period; i++) {
        const weight = period - i;
        numerator += window[i] * weight;
        denominator += weight;
      }
      const wma2 = numerator / denominator;
      return context.precision(wma2);
    };
  }

  function wpr(context) {
    return (_length, _callId) => {
      const length = Series.from(_length).get(0);
      if (!context.taState) context.taState = {};
      const stateKey = _callId || `wpr_${length}`;
      if (!context.taState[stateKey]) {
        context.taState[stateKey] = {
          lastIdx: -1,
          // Committed state
          prevHighWindow: [],
          prevLowWindow: [],
          // Tentative state
          currentHighWindow: [],
          currentLowWindow: []
        };
      }
      const state = context.taState[stateKey];
      if (context.idx > state.lastIdx) {
        if (state.lastIdx >= 0) {
          state.prevHighWindow = [...state.currentHighWindow];
          state.prevLowWindow = [...state.currentLowWindow];
        }
        state.lastIdx = context.idx;
      }
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      const close = context.get(context.data.close, 0);
      if (isNaN(high) || isNaN(low) || isNaN(close)) {
        state.currentHighWindow = [...state.prevHighWindow];
        state.currentLowWindow = [...state.prevLowWindow];
        return NaN;
      }
      const highWindow = [...state.prevHighWindow];
      const lowWindow = [...state.prevLowWindow];
      highWindow.unshift(high);
      lowWindow.unshift(low);
      if (highWindow.length > length) {
        highWindow.pop();
        lowWindow.pop();
      }
      state.currentHighWindow = highWindow;
      state.currentLowWindow = lowWindow;
      if (highWindow.length < length) {
        return NaN;
      }
      let highestHigh = highWindow[0];
      let lowestLow = lowWindow[0];
      for (let i = 1; i < length; i++) {
        if (highWindow[i] > highestHigh) {
          highestHigh = highWindow[i];
        }
        if (lowWindow[i] < lowestLow) {
          lowestLow = lowWindow[i];
        }
      }
      const range = highestHigh - lowestLow;
      if (range === 0) {
        return context.precision(0);
      }
      const wpr2 = (highestHigh - close) / range * -100;
      return context.precision(wpr2);
    };
  }

  function wvad(context) {
    return (_callId) => {
      const close = context.get(context.data.close, 0);
      const open = context.get(context.data.open, 0);
      const high = context.get(context.data.high, 0);
      const low = context.get(context.data.low, 0);
      const volume = context.get(context.data.volume, 0);
      if (isNaN(close) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(volume)) {
        return NaN;
      }
      const range = high - low;
      if (range === 0) {
        return context.precision(0);
      }
      const wvad2 = (close - open) / range * volume;
      return context.precision(wvad2);
    };
  }

  var __defProp$j = Object.defineProperty;
  var __defNormalProp$j = (obj, key, value) => key in obj ? __defProp$j(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$j = (obj, key, value) => __defNormalProp$j(obj, typeof key !== "symbol" ? key + "" : key, value);
  const methods = {
    accdist,
    alma,
    atr,
    barssince,
    bb,
    bbw,
    cci,
    change,
    cmo,
    cog,
    correlation,
    cross,
    crossover,
    crossunder,
    cum,
    dev,
    dmi,
    ema,
    falling,
    highest,
    highestbars,
    hma,
    iii,
    kc,
    kcw,
    linreg,
    lowest,
    lowestbars,
    macd,
    median,
    mfi,
    mode,
    mom,
    nvi,
    obv,
    param,
    percentile_linear_interpolation,
    percentile_nearest_rank,
    percentrank,
    pivothigh,
    pivotlow,
    pvi,
    pvt,
    range,
    rising,
    rma,
    roc,
    rsi,
    sar,
    sma,
    stdev,
    stoch,
    supertrend,
    swma,
    tr,
    tsi,
    valuewhen,
    variance,
    vwap,
    vwma,
    wad,
    wma,
    wpr,
    wvad
  };
  class TechnicalAnalysis {
    constructor(context) {
      this.context = context;
      __publicField$j(this, "accdist");
      __publicField$j(this, "alma");
      __publicField$j(this, "atr");
      __publicField$j(this, "barssince");
      __publicField$j(this, "bb");
      __publicField$j(this, "bbw");
      __publicField$j(this, "cci");
      __publicField$j(this, "change");
      __publicField$j(this, "cmo");
      __publicField$j(this, "cog");
      __publicField$j(this, "correlation");
      __publicField$j(this, "cross");
      __publicField$j(this, "crossover");
      __publicField$j(this, "crossunder");
      __publicField$j(this, "cum");
      __publicField$j(this, "dev");
      __publicField$j(this, "dmi");
      __publicField$j(this, "ema");
      __publicField$j(this, "falling");
      __publicField$j(this, "highest");
      __publicField$j(this, "highestbars");
      __publicField$j(this, "hma");
      __publicField$j(this, "iii");
      __publicField$j(this, "kc");
      __publicField$j(this, "kcw");
      __publicField$j(this, "linreg");
      __publicField$j(this, "lowest");
      __publicField$j(this, "lowestbars");
      __publicField$j(this, "macd");
      __publicField$j(this, "median");
      __publicField$j(this, "mfi");
      __publicField$j(this, "mode");
      __publicField$j(this, "mom");
      __publicField$j(this, "nvi");
      __publicField$j(this, "obv");
      __publicField$j(this, "param");
      __publicField$j(this, "percentile_linear_interpolation");
      __publicField$j(this, "percentile_nearest_rank");
      __publicField$j(this, "percentrank");
      __publicField$j(this, "pivothigh");
      __publicField$j(this, "pivotlow");
      __publicField$j(this, "pvi");
      __publicField$j(this, "pvt");
      __publicField$j(this, "range");
      __publicField$j(this, "rising");
      __publicField$j(this, "rma");
      __publicField$j(this, "roc");
      __publicField$j(this, "rsi");
      __publicField$j(this, "sar");
      __publicField$j(this, "sma");
      __publicField$j(this, "stdev");
      __publicField$j(this, "stoch");
      __publicField$j(this, "supertrend");
      __publicField$j(this, "swma");
      __publicField$j(this, "tr");
      __publicField$j(this, "tsi");
      __publicField$j(this, "valuewhen");
      __publicField$j(this, "variance");
      __publicField$j(this, "vwap");
      __publicField$j(this, "vwma");
      __publicField$j(this, "wad");
      __publicField$j(this, "wma");
      __publicField$j(this, "wpr");
      __publicField$j(this, "wvad");
      Object.entries(methods).forEach(([name, factory]) => {
        this[name] = factory(context);
      });
    }
  }

  class Log {
    constructor(context) {
      this.context = context;
    }
    logFormat(message, ...args) {
      return message.replace(/{(\d+)}/g, (match, index) => args[index]);
    }
    param(source, index = 0, name) {
      return Series.from(source).get(index);
    }
    warning(message, ...args) {
      console.warn(this.logFormat(message, ...args));
    }
    error(message, ...args) {
      console.error(this.logFormat(message, ...args));
    }
    info(message, ...args) {
      console.log(this.logFormat(message, ...args));
    }
  }

  class Str {
    constructor(context) {
      this.context = context;
    }
    param(source, index = 0, name) {
      return Series.from(source).get(index);
    }
    tostring(value) {
      return String(value);
    }
    tonumber(value) {
      return Number(value);
    }
    lower(value) {
      return String(value).toLowerCase();
    }
    upper(value) {
      return String(value).toUpperCase();
    }
    trim(value) {
      return String(value).trim();
    }
    repeat(source, repeat, separator = "") {
      return Array(repeat).fill(source).join(separator || "");
    }
    replace_all(source, target, replacement) {
      return String(source).replaceAll(target, replacement);
    }
    //occurense is the nth occurrence to replace
    replace(source, target, replacement, occurrence = 0) {
      const str = String(source);
      const tgt = String(target);
      const repl = String(replacement);
      const occ = Math.floor(Number(occurrence)) || 0;
      if (tgt === "") return str;
      let pos = 0;
      let found = 0;
      while (true) {
        const idx = str.indexOf(tgt, pos);
        if (idx === -1) return str;
        if (found === occ) {
          return str.substring(0, idx) + repl + str.substring(idx + tgt.length);
        }
        found++;
        pos = idx + tgt.length;
      }
    }
    contains(source, target) {
      return String(source).includes(target);
    }
    endswith(source, target) {
      return String(source).endsWith(target);
    }
    startswith(source, target) {
      return String(source).startsWith(target);
    }
    pos(source, target) {
      const idx = String(source).indexOf(target);
      return idx === -1 ? NaN : idx;
    }
    length(source) {
      return String(source).length;
    }
    match(source, pattern) {
      return String(source).match(new RegExp(pattern));
    }
    split(source, separator) {
      return [String(source).split(separator)];
    }
    substring(source, begin_pos, end_pos) {
      return String(source).substring(begin_pos, end_pos);
    }
    format(message, ...args) {
      return message.replace(/{(\d+)}/g, (match, index) => args[index]);
    }
    /**
     * Converts a UNIX timestamp to a formatted string using the specified format and timezone.
     * @param time - UNIX timestamp in milliseconds
     * @param format - Format pattern string (e.g., "yyyy.MM.dd HH:mm:ss")
     * @param timezone - Optional timezone (e.g., "America/New_York", "UTC")
     * @returns Formatted date/time string
     *
     * Supported format patterns:
     * - yyyy/YYYY: 4-digit year
     * - yy/YY: 2-digit year
     * - MM: Month (01-12)
     * - MMM: Month short name (Jan, Feb...)
     * - MMMM: Month full name (January, February...)
     * - dd: Day of month (01-31)
     * - d: Day of month (1-31)
     * - HH: Hour 24h (00-23)
     * - H: Hour 24h (0-23)
     * - hh: Hour 12h (01-12)
     * - h: Hour 12h (1-12)
     * - mm: Minutes (00-59)
     * - m: Minutes (0-59)
     * - ss: Seconds (00-59)
     * - s: Seconds (0-59)
     * - SSS: Milliseconds (000-999)
     * - a: AM/PM
     * - z: Timezone abbreviation
     * - EEEE: Day of week full (Monday...)
     * - EEE/E: Day of week short (Mon...)
     */
    format_time(time, format = "yyyy.MM.dd HH:mm:ss", timezone) {
      if (time === null || time === void 0 || Number.isNaN(time)) {
        return "";
      }
      const date = new Date(time);
      const options = {
        timeZone: timezone || "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        weekday: "long"
      };
      let parts = {};
      try {
        const formatter = new Intl.DateTimeFormat("en-US", options);
        const formatParts = formatter.formatToParts(date);
        for (const part of formatParts) {
          parts[part.type] = part.value;
        }
      } catch (e) {
        const formatter = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
        const formatParts = formatter.formatToParts(date);
        for (const part of formatParts) {
          parts[part.type] = part.value;
        }
      }
      const year = parts.year || "";
      const month = parts.month || "";
      const day = parts.day || "";
      const hour24 = parts.hour || "";
      const minute = parts.minute || "";
      const second = parts.second || "";
      const weekday = parts.weekday || "";
      const ms = String(date.getUTCMilliseconds()).padStart(3, "0");
      const hour24Num = parseInt(hour24, 10);
      const hour12Num = hour24Num === 0 ? 12 : hour24Num > 12 ? hour24Num - 12 : hour24Num;
      const hour12 = String(hour12Num).padStart(2, "0");
      const ampm = hour24Num >= 12 ? "PM" : "AM";
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthFullNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      const monthIndex = parseInt(month, 10) - 1;
      const monthShort = monthNames[monthIndex] || "";
      const monthFull = monthFullNames[monthIndex] || "";
      const weekdayShort = weekday.substring(0, 3);
      let tzAbbr = "";
      try {
        const tzFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone || "UTC",
          timeZoneName: "short"
        });
        const tzParts = tzFormatter.formatToParts(date);
        const tzPart = tzParts.find((p) => p.type === "timeZoneName");
        tzAbbr = tzPart ? tzPart.value : "";
      } catch (e) {
        tzAbbr = "UTC";
      }
      let result = format;
      const tokens = {};
      let tokenIndex = 0;
      const getToken = (value) => {
        const token = `\0${tokenIndex++}\0`;
        tokens[token] = value;
        return token;
      };
      result = result.replace(/yyyy|YYYY/g, getToken(year));
      result = result.replace(/yy|YY/g, getToken(year.slice(-2)));
      result = result.replace(/MMMM/g, getToken(monthFull));
      result = result.replace(/MMM/g, getToken(monthShort));
      result = result.replace(/MM/g, getToken(month));
      result = result.replace(/EEEE/g, getToken(weekday));
      result = result.replace(/EEE/g, getToken(weekdayShort));
      result = result.replace(/(?<![A-Za-z])E(?![A-Za-z])/g, getToken(weekdayShort));
      result = result.replace(/dd/g, getToken(day));
      result = result.replace(/(?<![A-Za-z])d(?![A-Za-z])/g, getToken(String(parseInt(day, 10))));
      result = result.replace(/HH/g, getToken(hour24));
      result = result.replace(/(?<![A-Za-z])H(?![A-Za-z])/g, getToken(String(parseInt(hour24, 10))));
      result = result.replace(/hh/g, getToken(hour12));
      result = result.replace(/(?<![A-Za-z])h(?![A-Za-z])/g, getToken(String(hour12Num)));
      result = result.replace(/mm/g, getToken(minute));
      result = result.replace(/(?<![A-Za-z])m(?![A-Za-z])/g, getToken(String(parseInt(minute, 10))));
      result = result.replace(/ss/g, getToken(second));
      result = result.replace(/(?<![A-Za-z])s(?![A-Za-z])/g, getToken(String(parseInt(second, 10))));
      result = result.replace(/SSS/g, getToken(ms));
      result = result.replace(/(?<![A-Za-z])a(?![A-Za-z])/g, getToken(ampm));
      result = result.replace(/(?<![A-Za-z])z(?![A-Za-z])/g, getToken(tzAbbr));
      for (const [token, value] of Object.entries(tokens)) {
        result = result.split(token).join(value);
      }
      return result;
    }
  }

  class Timeframe {
    constructor(context) {
      this.context = context;
    }
    param(source, index = 0, name) {
      return Series.from(source).get(index);
    }
    //Note : current PineTS implementation does not differentiate between main_period and period because the timeframe is always taken from the main execution context.
    //once we implement indicator() function, the main_period can be overridden by the indicator's timeframe.
    get main_period() {
      return this.context.timeframe;
    }
    get period() {
      return this.context.timeframe;
    }
    get multiplier() {
      const val = parseInt(this.context.timeframe);
      return isNaN(val) ? 1 : val;
    }
    get isdwm() {
      return ["D", "W", "M"].includes(this.context.timeframe.slice(-1));
    }
    get isdaily() {
      return this.context.timeframe.slice(-1) === "D";
    }
    get isweekly() {
      return this.context.timeframe.slice(-1) === "W";
    }
    get ismonthly() {
      return this.context.timeframe.slice(-1) === "M";
    }
    get isseconds() {
      return this.context.timeframe.slice(-1) === "S";
    }
    get isminutes() {
      return parseInt(this.context.timeframe).toString() == this.context.timeframe.trim();
    }
    get isintraday() {
      return !this.isdwm;
    }
    // public change(timeframe: string) {
    //     const prevOpenTime = this.context.data.openTime.get(this.context.data.openTime.length - 2);
    //     const currentOpenTime = this.context.data.openTime.get(this.context.data.openTime.length - 1);
    // }
    from_seconds(seconds) {
      if (seconds < 60) {
        const roundedSeconds = Math.ceil(seconds / 5) * 5;
        return roundedSeconds + "S";
      }
      if (seconds < 60 * 60 * 24) {
        const roundedMinutes = Math.ceil(seconds / 60);
        return roundedMinutes;
      }
      if (seconds <= 60 * 60 * 24 * 7 * 52) {
        if (seconds % (60 * 60 * 24 * 7) === 0) {
          const roundedWeeks = Math.ceil(seconds / (60 * 60 * 24 * 7));
          return roundedWeeks + "W";
        }
        const roundedHours = Math.ceil(seconds / (60 * 60 * 24));
        return roundedHours + "D";
      }
      return "12M";
    }
    in_seconds(timeframe) {
      const multiplier = parseInt(timeframe);
      const unit = timeframe.slice(-1);
      if (unit === "S") {
        return multiplier;
      }
      if (unit === "D") {
        return multiplier * 60 * 60 * 24;
      }
      if (unit === "W") {
        return multiplier * 60 * 60 * 24 * 7;
      }
      if (unit === "M") {
        return multiplier * 60 * 60 * 24 * 30;
      }
      if (!isNaN(multiplier)) {
        return multiplier * 60;
      }
      return 0;
    }
  }

  class Ticker {
    constructor(context) {
      this.context = context;
    }
    /**
     * Helper method to unwrap Series values for the transpiler.
     * @param source - The source value (can be a Series or scalar)
     * @param index - The index to get from the Series (default: 0)
     * @returns The unwrapped value
     */
    param(source, index = 0) {
      return Series.from(source).get(index);
    }
    /**
     * Creates a ticker identifier.
     * @param prefix - Exchange prefix (e.g., "NASDAQ", "NYSE", "BINANCE")
     * @param ticker - Ticker symbol (e.g., "AAPL", "BTCUSDT")
     * @param session - Session type (optional): session.regular, session.extended, session.premarket, session.postmarket
     * @param adjustment - Adjustment type (optional): adjustment.none, adjustment.splits, adjustment.dividends
     * @returns A ticker identifier string in the format "PREFIX:TICKER"
     */
    new(prefix, ticker, session, adjustment) {
      let tickerId = `${prefix}:${ticker}`;
      return tickerId;
    }
    /**
     * Creates a standard ticker identifier from a symbol.
     * Standardizes the symbol to ensure it's in the proper format.
     * @param symbol - The symbol to standardize (can be "AAPL" or "NASDAQ:AAPL")
     * @returns A standardized ticker identifier
     */
    standard(symbol) {
      if (symbol.includes(":")) {
        return symbol;
      }
      const syminfo = this.context.pine?.syminfo;
      if (syminfo && syminfo.prefix) {
        return `${syminfo.prefix}:${symbol}`;
      }
      return symbol;
    }
    /**
     * Modifies a ticker identifier's session and/or adjustment settings.
     * @param tickerid - The original ticker identifier
     * @param session - New session type (optional)
     * @param adjustment - New adjustment type (optional)
     * @returns A modified ticker identifier
     */
    modify(tickerid, session, adjustment) {
      return tickerid;
    }
    /**
     * Creates a Heikin-Ashi ticker identifier.
     * When used with request.security(), returns Heikin-Ashi calculated values.
     * @param symbol - The symbol to convert to Heikin-Ashi (optional, defaults to current symbol)
     * @returns A Heikin-Ashi ticker identifier
     */
    heikinashi(symbol) {
      const baseSymbol = symbol || this._getCurrentTickerId();
      return `${baseSymbol}#HA`;
    }
    /**
     * Creates a Renko ticker identifier.
     * @param symbol - The symbol (optional, defaults to current symbol)
     * @param boxsize - The box size for Renko bars
     * @param style - The style: "Traditional" or "ATR"
     * @param request_wicks - Whether to include wicks
     * @param session - Session type (optional)
     * @param adjustment - Adjustment type (optional)
     * @returns A Renko ticker identifier
     */
    renko(symbol, boxsize = 1, style = "Traditional", request_wicks = false, session, adjustment) {
      const baseSymbol = symbol || this._getCurrentTickerId();
      return `${baseSymbol}#RENKO_${boxsize}_${style}`;
    }
    /**
     * Creates a Line Break ticker identifier.
     * @param symbol - The symbol (optional, defaults to current symbol)
     * @param number_of_lines - Number of lines for reversal (default: 3)
     * @param session - Session type (optional)
     * @param adjustment - Adjustment type (optional)
     * @returns A Line Break ticker identifier
     */
    linebreak(symbol, number_of_lines = 3, session, adjustment) {
      const baseSymbol = symbol || this._getCurrentTickerId();
      return `${baseSymbol}#LB_${number_of_lines}`;
    }
    /**
     * Creates a Kagi ticker identifier.
     * @param symbol - The symbol (optional, defaults to current symbol)
     * @param reversal - Reversal amount (number or percentage string like "3%")
     * @param session - Session type (optional)
     * @param adjustment - Adjustment type (optional)
     * @returns A Kagi ticker identifier
     */
    kagi(symbol, reversal = 1, session, adjustment) {
      const baseSymbol = symbol || this._getCurrentTickerId();
      return `${baseSymbol}#KAGI_${reversal}`;
    }
    /**
     * Creates a Point & Figure ticker identifier.
     * @param symbol - The symbol (optional, defaults to current symbol)
     * @param source - Source for calculations: "hl" or "close"
     * @param boxsize - The box size
     * @param reversal - Reversal amount (number of boxes)
     * @param session - Session type (optional)
     * @param adjustment - Adjustment type (optional)
     * @returns A Point & Figure ticker identifier
     */
    pointfigure(symbol, source = "hl", boxsize = 1, reversal = 3, session, adjustment) {
      const baseSymbol = symbol || this._getCurrentTickerId();
      return `${baseSymbol}#PF_${source}_${boxsize}_${reversal}`;
    }
    /**
     * Creates a ticker identifier that inherits session and other properties from another ticker.
     * @param from_tickerid - The ticker to inherit properties from
     * @param symbol - The symbol for the new ticker (optional)
     * @returns A ticker identifier with inherited properties
     */
    inherit(from_tickerid, symbol) {
      if (!symbol) {
        return from_tickerid;
      }
      if (from_tickerid.includes(":")) {
        const prefix = from_tickerid.split(":")[0];
        return `${prefix}:${symbol}`;
      }
      return symbol;
    }
    /**
     * Helper to get the current ticker ID from context.
     * @private
     */
    _getCurrentTickerId() {
      const syminfo = this.context.pine?.syminfo;
      if (syminfo) {
        return syminfo.tickerid || syminfo.ticker || "";
      }
      return this.context.tickerId || "";
    }
  }

  var __defProp$i = Object.defineProperty;
  var __defNormalProp$i = (obj, key, value) => key in obj ? __defProp$i(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$i = (obj, key, value) => __defNormalProp$i(obj, typeof key !== "symbol" ? key + "" : key, value);
  function createCallableProperty(defaultValue, parser) {
    const fn = ((tickerid) => {
      if (tickerid !== void 0) {
        return parser(tickerid);
      }
      return defaultValue;
    });
    fn.toString = () => defaultValue;
    fn.valueOf = () => defaultValue;
    return fn;
  }
  class Syminfo {
    constructor(context) {
      this.context = context;
      __publicField$i(this, "_info", null);
    }
    /**
     * Sets the symbol info from the provider
     */
    setSymbolInfo(info) {
      this._info = info;
    }
    // ============================================================
    // Callable Functions (also work as properties)
    // ============================================================
    /**
     * Returns the prefix (exchange) of the symbol
     * - As property: returns current symbol's prefix
     * - As function: syminfo.prefix("EXCHANGE:SYMBOL") extracts "EXCHANGE"
     */
    get prefix() {
      const value = this._info?.prefix || "";
      return createCallableProperty(value, (tickerid) => {
        const parts = tickerid.split(":");
        return parts.length > 1 ? parts[0] : "";
      });
    }
    /**
     * Returns the ticker of the symbol (without exchange prefix)
     * - As property: returns current symbol's ticker
     * - As function: syminfo.ticker("EXCHANGE:SYMBOL") extracts "SYMBOL"
     */
    get ticker() {
      const value = this._info?.ticker || "";
      return createCallableProperty(value, (tickerid) => {
        const colonIndex = tickerid.indexOf(":");
        return colonIndex > -1 ? tickerid.slice(colonIndex + 1) : tickerid;
      });
    }
    // ============================================================
    // Symbol Identification
    // ============================================================
    get current_contract() {
      return this._info?.current_contract || "";
    }
    get description() {
      return this._info?.description || "";
    }
    get isin() {
      return this._info?.isin || "";
    }
    get main_tickerid() {
      return this._info?.main_tickerid || "";
    }
    get root() {
      return this._info?.root || "";
    }
    get tickerid() {
      return this._info?.tickerid || "";
    }
    get type() {
      return this._info?.type || "";
    }
    // ============================================================
    // Currency & Location
    // ============================================================
    get basecurrency() {
      return this._info?.basecurrency || "";
    }
    get country() {
      return this._info?.country || "";
    }
    get currency() {
      return this._info?.currency || "";
    }
    get timezone() {
      return this._info?.timezone || "Etc/UTC";
    }
    // ============================================================
    // Company Data
    // ============================================================
    get employees() {
      return this._info?.employees || 0;
    }
    get industry() {
      return this._info?.industry || "";
    }
    get sector() {
      return this._info?.sector || "";
    }
    get shareholders() {
      return this._info?.shareholders || 0;
    }
    get shares_outstanding_float() {
      return this._info?.shares_outstanding_float || 0;
    }
    get shares_outstanding_total() {
      return this._info?.shares_outstanding_total || 0;
    }
    // ============================================================
    // Session & Market
    // ============================================================
    get expiration_date() {
      return this._info?.expiration_date || 0;
    }
    get session() {
      return this._info?.session || "";
    }
    get volumetype() {
      return this._info?.volumetype || "";
    }
    // ============================================================
    // Price & Contract Info
    // ============================================================
    get mincontract() {
      return this._info?.mincontract || 1;
    }
    get minmove() {
      return this._info?.minmove || 1;
    }
    get mintick() {
      return this._info?.mintick || 0.01;
    }
    get pointvalue() {
      return this._info?.pointvalue || 1;
    }
    get pricescale() {
      return this._info?.pricescale || 100;
    }
    // ============================================================
    // Analyst Ratings
    // ============================================================
    get recommendations_buy() {
      return this._info?.recommendations_buy || 0;
    }
    get recommendations_buy_strong() {
      return this._info?.recommendations_buy_strong || 0;
    }
    get recommendations_date() {
      return this._info?.recommendations_date || 0;
    }
    get recommendations_hold() {
      return this._info?.recommendations_hold || 0;
    }
    get recommendations_sell() {
      return this._info?.recommendations_sell || 0;
    }
    get recommendations_sell_strong() {
      return this._info?.recommendations_sell_strong || 0;
    }
    get recommendations_total() {
      return this._info?.recommendations_total || 0;
    }
    // ============================================================
    // Price Targets
    // ============================================================
    get target_price_average() {
      return this._info?.target_price_average || 0;
    }
    get target_price_date() {
      return this._info?.target_price_date || 0;
    }
    get target_price_estimates() {
      return this._info?.target_price_estimates || 0;
    }
    get target_price_high() {
      return this._info?.target_price_high || 0;
    }
    get target_price_low() {
      return this._info?.target_price_low || 0;
    }
    get target_price_median() {
      return this._info?.target_price_median || 0;
    }
  }

  var __defProp$h = Object.defineProperty;
  var __defNormalProp$h = (obj, key, value) => key in obj ? __defProp$h(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$h = (obj, key, value) => __defNormalProp$h(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Chart {
    constructor(context) {
      this.context = context;
      // ============================================================
      // chart.point Functions
      // ============================================================
      /**
       * The point sub-namespace containing chart.point functions
       */
      __publicField$h(this, "point", {
        /**
         * Creates a copy of a chart.point object.
         * @param point - The chart.point to copy
         * @returns A new chart.point with the same values
         */
        copy: (point) => {
          return {
            index: point.index,
            time: point.time,
            price: point.price
          };
        },
        /**
         * Creates a chart.point from a bar_index and price.
         * @param index - The bar index
         * @param price - The price level
         * @returns A chart.point object
         */
        from_index: (index, price) => {
          const context = this.context;
          const barIndex = Series.from(index).get(0);
          const priceVal = Series.from(price).get(0);
          let time = NaN;
          if (context.data?.openTime) {
            const dataLength = context.data.openTime.length;
            const actualIndex = dataLength - 1 - barIndex;
            if (actualIndex >= 0 && actualIndex < dataLength) {
              time = context.data.openTime.data[actualIndex];
            }
          }
          return {
            index: barIndex,
            time,
            price: priceVal
          };
        },
        /**
         * Creates a chart.point from a time and price.
         * @param time - The timestamp
         * @param price - The price level
         * @returns A chart.point object
         */
        from_time: (time, price) => {
          const context = this.context;
          const timeVal = Series.from(time).get(0);
          const priceVal = Series.from(price).get(0);
          let index = NaN;
          if (context.data?.openTime) {
            const times = context.data.openTime.data;
            for (let i = 0; i < times.length; i++) {
              if (times[i] >= timeVal) {
                index = times.length - 1 - i;
                break;
              }
            }
          }
          return {
            index,
            time: timeVal,
            price: priceVal
          };
        },
        /**
         * Creates a new chart.point with specified values.
         * @param time - The timestamp (optional)
         * @param index - The bar index (optional)
         * @param price - The price level
         * @returns A chart.point object
         */
        new: (price, options) => {
          const context = this.context;
          const priceVal = Series.from(price).get(0);
          let timeVal;
          let indexVal;
          if (options?.time !== void 0) {
            timeVal = Series.from(options.time).get(0);
            indexVal = NaN;
            if (context.data?.openTime) {
              const times = context.data.openTime.data;
              for (let i = 0; i < times.length; i++) {
                if (times[i] >= timeVal) {
                  indexVal = times.length - 1 - i;
                  break;
                }
              }
            }
          } else if (options?.index !== void 0) {
            indexVal = Series.from(options.index).get(0);
            timeVal = NaN;
            if (context.data?.openTime) {
              const dataLength = context.data.openTime.length;
              const actualIndex = dataLength - 1 - indexVal;
              if (actualIndex >= 0 && actualIndex < dataLength) {
                timeVal = context.data.openTime.data[actualIndex];
              }
            }
          } else {
            indexVal = context.idx || 0;
            timeVal = context.data?.openTime?.get(0) || NaN;
          }
          return {
            index: indexVal,
            time: timeVal,
            price: priceVal
          };
        },
        /**
         * Creates a chart.point at the current bar with current price.
         * @param price - The price level (optional, defaults to close)
         * @returns A chart.point object for the current bar
         */
        now: (price) => {
          const context = this.context;
          const priceVal = price !== void 0 ? Series.from(price).get(0) : context.data?.close?.get(0) || NaN;
          return {
            index: context.idx || 0,
            time: context.data?.openTime?.get(0) || NaN,
            price: priceVal
          };
        }
      });
    }
    /**
     * Helper method to unwrap Series values for the transpiler.
     */
    param(source, index = 0) {
      return Series.from(source).get(index);
    }
    // ============================================================
    // Chart Properties
    // ============================================================
    /**
     * Background color of the chart.
     * Returns the chart's background color setting.
     */
    get bg_color() {
      return this.context.chartSettings?.bg_color || "#131722";
    }
    /**
     * Foreground color of the chart.
     * Returns the chart's foreground (text) color setting.
     */
    get fg_color() {
      return this.context.chartSettings?.fg_color || "#B2B5BE";
    }
    // ============================================================
    // Chart Type Detection
    // ============================================================
    /**
     * Returns true if the chart type is Heikin-Ashi.
     */
    get is_heikinashi() {
      return this.context.chartType === "heikinashi";
    }
    /**
     * Returns true if the chart type is Kagi.
     */
    get is_kagi() {
      return this.context.chartType === "kagi";
    }
    /**
     * Returns true if the chart type is Line Break.
     */
    get is_linebreak() {
      return this.context.chartType === "linebreak";
    }
    /**
     * Returns true if the chart type is Point & Figure.
     */
    get is_pnf() {
      return this.context.chartType === "pnf";
    }
    /**
     * Returns true if the chart type is Range.
     */
    get is_range() {
      return this.context.chartType === "range";
    }
    /**
     * Returns true if the chart type is Renko.
     */
    get is_renko() {
      return this.context.chartType === "renko";
    }
    /**
     * Returns true if the chart type is Standard (candlestick/OHLC).
     */
    get is_standard() {
      return !this.context.chartType || this.context.chartType === "standard";
    }
    // ============================================================
    // Visible Bar Range
    // ============================================================
    /**
     * Returns the bar_time of the leftmost visible bar on the chart.
     */
    get left_visible_bar_time() {
      return this.context.data?.openTime?.get(this.context.data.openTime.length - 1) || NaN;
    }
    /**
     * Returns the bar_time of the rightmost visible bar on the chart.
     */
    get right_visible_bar_time() {
      return this.context.data?.openTime?.get(0) || NaN;
    }
  }

  var __defProp$g = Object.defineProperty;
  var __defNormalProp$g = (obj, key, value) => key in obj ? __defProp$g(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$g = (obj, key, value) => __defNormalProp$g(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Session {
    constructor(context) {
      this.context = context;
      // ============================================================
      // Session Constants
      // ============================================================
      /**
       * Constant for extended session type.
       * Used with request.security() to request extended hours data.
       */
      __publicField$g(this, "extended", "extended");
      /**
       * Constant for regular session type.
       * Used with request.security() to request regular hours data only.
       */
      __publicField$g(this, "regular", "regular");
    }
    /**
     * Helper method to unwrap Series values for the transpiler.
     */
    param(source, index = 0) {
      return Series.from(source).get(index);
    }
    // ============================================================
    // Session Bar Flags
    // ============================================================
    /**
     * Returns true if the current bar is the first bar of the session.
     * A session starts at the beginning of the trading day.
     */
    get isfirstbar() {
      const context = this.context;
      const currentTime = context.data?.openTime?.get(0);
      const prevTime = context.data?.openTime?.get(1);
      if (isNaN(currentTime)) return false;
      if (isNaN(prevTime)) return true;
      const currentDate = new Date(currentTime);
      const prevDate = new Date(prevTime);
      return currentDate.getUTCFullYear() !== prevDate.getUTCFullYear() || currentDate.getUTCMonth() !== prevDate.getUTCMonth() || currentDate.getUTCDate() !== prevDate.getUTCDate();
    }
    /**
     * Returns true if the current bar is the first bar of the regular session.
     * Similar to isfirstbar but only considers regular trading hours.
     */
    get isfirstbar_regular() {
      return this.isfirstbar && this.ismarket;
    }
    /**
     * Returns true if the current bar is the last bar of the session.
     */
    get islastbar() {
      const context = this.context;
      const currentTime = context.data?.openTime?.get(0);
      if (context.idx === context.data?.close?.length - 1) {
        return true;
      }
      const nextIdx = context.idx + 1;
      if (nextIdx < context.data?.openTime?.length) {
        const dataLength = context.data.openTime.data.length;
        const currentActualIdx = dataLength - 1 - context.idx;
        const nextActualIdx = currentActualIdx + 1;
        if (nextActualIdx < dataLength) {
          const nextTime = context.data.openTime.data[nextActualIdx];
          const currentDate = new Date(currentTime);
          const nextDate = new Date(nextTime);
          return currentDate.getUTCFullYear() !== nextDate.getUTCFullYear() || currentDate.getUTCMonth() !== nextDate.getUTCMonth() || currentDate.getUTCDate() !== nextDate.getUTCDate();
        }
      }
      return false;
    }
    /**
     * Returns true if the current bar is the last bar of the regular session.
     * Similar to islastbar but only considers regular trading hours.
     */
    get islastbar_regular() {
      return this.islastbar && this.ismarket;
    }
    /**
     * Returns true if the current bar is during regular market hours.
     * Market hours are typically 9:30 AM - 4:00 PM for US markets.
     */
    get ismarket() {
      const context = this.context;
      const currentTime = context.data?.openTime?.get(0);
      if (isNaN(currentTime)) return false;
      const syminfo = context.pine?.syminfo;
      if (syminfo?.type === "crypto") {
        return true;
      }
      const date = new Date(currentTime);
      const utcHour = date.getUTCHours();
      const utcMinute = date.getUTCMinutes();
      const utcTime = utcHour * 60 + utcMinute;
      const marketOpen = 14 * 60 + 30;
      const marketClose = 21 * 60;
      return utcTime >= marketOpen && utcTime < marketClose;
    }
    /**
     * Returns true if the current bar is during post-market hours.
     * Post-market is typically 4:00 PM - 8:00 PM for US markets.
     */
    get ispostmarket() {
      const context = this.context;
      const currentTime = context.data?.openTime?.get(0);
      if (isNaN(currentTime)) return false;
      const syminfo = context.pine?.syminfo;
      if (syminfo?.type === "crypto") {
        return false;
      }
      const date = new Date(currentTime);
      const utcHour = date.getUTCHours();
      const utcMinute = date.getUTCMinutes();
      const utcTime = utcHour * 60 + utcMinute;
      const postMarketStart = 21 * 60;
      const postMarketEnd = 24 * 60;
      return utcTime >= postMarketStart && utcTime < postMarketEnd;
    }
    /**
     * Returns true if the current bar is during pre-market hours.
     * Pre-market is typically 4:00 AM - 9:30 AM for US markets.
     */
    get ispremarket() {
      const context = this.context;
      const currentTime = context.data?.openTime?.get(0);
      if (isNaN(currentTime)) return false;
      const syminfo = context.pine?.syminfo;
      if (syminfo?.type === "crypto") {
        return false;
      }
      const date = new Date(currentTime);
      const utcHour = date.getUTCHours();
      const utcMinute = date.getUTCMinutes();
      const utcTime = utcHour * 60 + utcMinute;
      const preMarketStart = 9 * 60;
      const preMarketEnd = 14 * 60 + 30;
      return utcTime >= preMarketStart && utcTime < preMarketEnd;
    }
  }

  var __defProp$f = Object.defineProperty;
  var __defNormalProp$f = (obj, key, value) => key in obj ? __defProp$f(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$f = (obj, key, value) => __defNormalProp$f(obj, typeof key !== "symbol" ? key + "" : key, value);
  const _BoxObject = class _BoxObject {
    constructor(context, options = {}) {
      this.context = context;
      __publicField$f(this, "_id");
      __publicField$f(this, "_left");
      __publicField$f(this, "_top");
      __publicField$f(this, "_right");
      __publicField$f(this, "_bottom");
      __publicField$f(this, "_border_color");
      __publicField$f(this, "_border_width");
      __publicField$f(this, "_border_style");
      __publicField$f(this, "_bgcolor");
      __publicField$f(this, "_extend");
      __publicField$f(this, "_xloc");
      __publicField$f(this, "_text");
      __publicField$f(this, "_text_size");
      __publicField$f(this, "_text_color");
      __publicField$f(this, "_text_halign");
      __publicField$f(this, "_text_valign");
      __publicField$f(this, "_text_wrap");
      __publicField$f(this, "_text_font_family");
      this._id = _BoxObject._nextId++;
      this._left = options.left ?? 0;
      this._top = options.top ?? 0;
      this._right = options.right ?? 0;
      this._bottom = options.bottom ?? 0;
      this._border_color = options.border_color ?? "#2196F3";
      this._border_width = options.border_width ?? 1;
      this._border_style = options.border_style ?? "solid";
      this._bgcolor = options.bgcolor ?? "";
      this._extend = options.extend ?? "none";
      this._xloc = options.xloc ?? "bar_index";
      this._text = options.text ?? "";
      this._text_size = options.text_size ?? "normal";
      this._text_color = options.text_color ?? "#000000";
      this._text_halign = options.text_halign ?? "center";
      this._text_valign = options.text_valign ?? "center";
      this._text_wrap = options.text_wrap ?? "auto";
      this._text_font_family = options.text_font_family ?? "default";
    }
    // Getters
    get_left() {
      return this._left;
    }
    get_top() {
      return this._top;
    }
    get_right() {
      return this._right;
    }
    get_bottom() {
      return this._bottom;
    }
    // Setters
    set_left(left) {
      this._left = Series.from(left).get(0);
    }
    set_top(top) {
      this._top = Series.from(top).get(0);
    }
    set_right(right) {
      this._right = Series.from(right).get(0);
    }
    set_bottom(bottom) {
      this._bottom = Series.from(bottom).get(0);
    }
    set_lefttop(left, top) {
      this._left = Series.from(left).get(0);
      this._top = Series.from(top).get(0);
    }
    set_rightbottom(right, bottom) {
      this._right = Series.from(right).get(0);
      this._bottom = Series.from(bottom).get(0);
    }
    set_border_color(color) {
      this._border_color = Series.from(color).get(0);
    }
    set_border_width(width) {
      this._border_width = Series.from(width).get(0);
    }
    set_border_style(style) {
      this._border_style = Series.from(style).get(0);
    }
    set_bgcolor(color) {
      this._bgcolor = Series.from(color).get(0);
    }
    set_extend(extend) {
      this._extend = Series.from(extend).get(0);
    }
    set_text(text) {
      this._text = Series.from(text).get(0);
    }
    set_text_size(size) {
      this._text_size = Series.from(size).get(0);
    }
    set_text_color(color) {
      this._text_color = Series.from(color).get(0);
    }
    set_text_halign(halign) {
      this._text_halign = Series.from(halign).get(0);
    }
    set_text_valign(valign) {
      this._text_valign = Series.from(valign).get(0);
    }
    set_text_wrap(wrap) {
      this._text_wrap = Series.from(wrap).get(0);
    }
    set_text_font_family(family) {
      this._text_font_family = Series.from(family).get(0);
    }
    /**
     * Returns a copy of this box object
     */
    copy() {
      return new _BoxObject(this.context, {
        left: this._left,
        top: this._top,
        right: this._right,
        bottom: this._bottom,
        border_color: this._border_color,
        border_width: this._border_width,
        border_style: this._border_style,
        bgcolor: this._bgcolor,
        extend: this._extend,
        xloc: this._xloc,
        text: this._text,
        text_size: this._text_size,
        text_color: this._text_color,
        text_halign: this._text_halign,
        text_valign: this._text_valign,
        text_wrap: this._text_wrap,
        text_font_family: this._text_font_family
      });
    }
    /**
     * Deletes the box (removes from rendering)
     */
    delete() {
      this._deleted = true;
    }
    /**
     * Gets the box's properties for rendering
     */
    toJSON() {
      return {
        id: this._id,
        left: this._left,
        top: this._top,
        right: this._right,
        bottom: this._bottom,
        border_color: this._border_color,
        border_width: this._border_width,
        border_style: this._border_style,
        bgcolor: this._bgcolor,
        extend: this._extend,
        xloc: this._xloc,
        text: this._text,
        text_size: this._text_size,
        text_color: this._text_color,
        text_halign: this._text_halign,
        text_valign: this._text_valign,
        text_wrap: this._text_wrap,
        text_font_family: this._text_font_family
      };
    }
  };
  __publicField$f(_BoxObject, "_nextId", 1);
  let BoxObject = _BoxObject;

  var __defProp$e = Object.defineProperty;
  var __defNormalProp$e = (obj, key, value) => key in obj ? __defProp$e(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$e = (obj, key, value) => __defNormalProp$e(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Box {
    constructor(context) {
      this.context = context;
      __publicField$e(this, "_boxes", []);
    }
    /**
     * Helper method to unwrap Series values
     */
    param(source, index = 0) {
      return Series.from(source).get(index);
    }
    /**
     * Returns an array of all box objects on the chart.
     */
    get all() {
      return this._boxes.filter((b) => !b._deleted);
    }
    /**
     * Creates a new box object.
     */
    new(left, top, right, bottom, border_color, border_width, border_style, extend, xloc, bgcolor, text, text_size, text_color, text_halign, text_valign, text_wrap, text_font_family) {
      const box = new BoxObject(this.context, {
        left: Series.from(left).get(0),
        top: Series.from(top).get(0),
        right: Series.from(right).get(0),
        bottom: Series.from(bottom).get(0),
        border_color: border_color ? Series.from(border_color).get(0) : void 0,
        border_width: border_width ? Series.from(border_width).get(0) : void 0,
        border_style: border_style ? Series.from(border_style).get(0) : void 0,
        bgcolor: bgcolor ? Series.from(bgcolor).get(0) : void 0,
        extend: extend ? Series.from(extend).get(0) : void 0,
        xloc: xloc ? Series.from(xloc).get(0) : void 0,
        text: text ? Series.from(text).get(0) : void 0,
        text_size: text_size ? Series.from(text_size).get(0) : void 0,
        text_color: text_color ? Series.from(text_color).get(0) : void 0,
        text_halign: text_halign ? Series.from(text_halign).get(0) : void 0,
        text_valign: text_valign ? Series.from(text_valign).get(0) : void 0,
        text_wrap: text_wrap ? Series.from(text_wrap).get(0) : void 0,
        text_font_family: text_font_family ? Series.from(text_font_family).get(0) : void 0
      });
      this._boxes.push(box);
      return box;
    }
    /**
     * Creates a copy of a box object.
     */
    copy(id) {
      const copy = id.copy();
      this._boxes.push(copy);
      return copy;
    }
    /**
     * Deletes a box object.
     */
    delete(id) {
      if (id) {
        id.delete();
      }
    }
    // Getter wrappers
    get_left(id) {
      return id?.get_left() ?? NaN;
    }
    get_top(id) {
      return id?.get_top() ?? NaN;
    }
    get_right(id) {
      return id?.get_right() ?? NaN;
    }
    get_bottom(id) {
      return id?.get_bottom() ?? NaN;
    }
    // Setter wrappers
    set_left(id, left) {
      id?.set_left(left);
    }
    set_top(id, top) {
      id?.set_top(top);
    }
    set_right(id, right) {
      id?.set_right(right);
    }
    set_bottom(id, bottom) {
      id?.set_bottom(bottom);
    }
    set_lefttop(id, left, top) {
      id?.set_lefttop(left, top);
    }
    set_rightbottom(id, right, bottom) {
      id?.set_rightbottom(right, bottom);
    }
    set_border_color(id, color) {
      id?.set_border_color(color);
    }
    set_border_width(id, width) {
      id?.set_border_width(width);
    }
    set_border_style(id, style) {
      id?.set_border_style(style);
    }
    set_bgcolor(id, color) {
      id?.set_bgcolor(color);
    }
    set_extend(id, extend) {
      id?.set_extend(extend);
    }
    set_text(id, text) {
      id?.set_text(text);
    }
    set_text_size(id, size) {
      id?.set_text_size(size);
    }
    set_text_color(id, color) {
      id?.set_text_color(color);
    }
    set_text_halign(id, halign) {
      id?.set_text_halign(halign);
    }
    set_text_valign(id, valign) {
      id?.set_text_valign(valign);
    }
    set_text_wrap(id, wrap) {
      id?.set_text_wrap(wrap);
    }
    set_text_font_family(id, family) {
      id?.set_text_font_family(family);
    }
  }

  var __defProp$d = Object.defineProperty;
  var __defNormalProp$d = (obj, key, value) => key in obj ? __defProp$d(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$d = (obj, key, value) => __defNormalProp$d(obj, typeof key !== "symbol" ? key + "" : key, value);
  const _LabelObject = class _LabelObject {
    constructor(context, options = {}) {
      this.context = context;
      __publicField$d(this, "_id");
      __publicField$d(this, "_x");
      __publicField$d(this, "_y");
      __publicField$d(this, "_text");
      __publicField$d(this, "_xloc");
      __publicField$d(this, "_yloc");
      __publicField$d(this, "_color");
      __publicField$d(this, "_style");
      __publicField$d(this, "_textcolor");
      __publicField$d(this, "_size");
      __publicField$d(this, "_textalign");
      __publicField$d(this, "_tooltip");
      __publicField$d(this, "_text_font_family");
      this._id = _LabelObject._nextId++;
      this._x = options.x ?? 0;
      this._y = options.y ?? 0;
      this._text = options.text ?? "";
      this._xloc = options.xloc ?? "bar_index";
      this._yloc = options.yloc ?? "price";
      this._color = options.color ?? "#2196F3";
      this._style = options.style ?? "label_down";
      this._textcolor = options.textcolor ?? "#FFFFFF";
      this._size = options.size ?? "normal";
      this._textalign = options.textalign ?? "center";
      this._tooltip = options.tooltip ?? "";
      this._text_font_family = options.text_font_family ?? "default";
    }
    // Getters
    get_x() {
      return this._x;
    }
    get_y() {
      return this._y;
    }
    get_text() {
      return this._text;
    }
    // Setters
    set_x(x) {
      this._x = Series.from(x).get(0);
    }
    set_y(y) {
      this._y = Series.from(y).get(0);
    }
    set_xy(x, y) {
      this._x = Series.from(x).get(0);
      this._y = Series.from(y).get(0);
    }
    set_text(text) {
      this._text = Series.from(text).get(0);
    }
    set_xloc(xloc) {
      this._xloc = Series.from(xloc).get(0);
    }
    set_yloc(yloc) {
      this._yloc = Series.from(yloc).get(0);
    }
    set_color(color) {
      this._color = Series.from(color).get(0);
    }
    set_style(style) {
      this._style = Series.from(style).get(0);
    }
    set_textcolor(color) {
      this._textcolor = Series.from(color).get(0);
    }
    set_size(size) {
      this._size = Series.from(size).get(0);
    }
    set_textalign(align) {
      this._textalign = Series.from(align).get(0);
    }
    set_tooltip(tooltip) {
      this._tooltip = Series.from(tooltip).get(0);
    }
    set_text_font_family(family) {
      this._text_font_family = Series.from(family).get(0);
    }
    /**
     * Returns a copy of this label object
     */
    copy() {
      return new _LabelObject(this.context, {
        x: this._x,
        y: this._y,
        text: this._text,
        xloc: this._xloc,
        yloc: this._yloc,
        color: this._color,
        style: this._style,
        textcolor: this._textcolor,
        size: this._size,
        textalign: this._textalign,
        tooltip: this._tooltip,
        text_font_family: this._text_font_family
      });
    }
    /**
     * Deletes the label (removes from rendering)
     */
    delete() {
      this._deleted = true;
    }
    /**
     * Gets the label's properties for rendering
     */
    toJSON() {
      return {
        id: this._id,
        x: this._x,
        y: this._y,
        text: this._text,
        xloc: this._xloc,
        yloc: this._yloc,
        color: this._color,
        style: this._style,
        textcolor: this._textcolor,
        size: this._size,
        textalign: this._textalign,
        tooltip: this._tooltip,
        text_font_family: this._text_font_family
      };
    }
  };
  __publicField$d(_LabelObject, "_nextId", 1);
  let LabelObject = _LabelObject;

  var __defProp$c = Object.defineProperty;
  var __defNormalProp$c = (obj, key, value) => key in obj ? __defProp$c(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$c = (obj, key, value) => __defNormalProp$c(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Label {
    constructor(context) {
      this.context = context;
      __publicField$c(this, "_labels", []);
    }
    /**
     * Helper method to unwrap Series values
     */
    param(source, index = 0) {
      return Series.from(source).get(index);
    }
    /**
     * Returns an array of all label objects on the chart.
     */
    get all() {
      return this._labels.filter((l) => !l._deleted);
    }
    /**
     * Creates a new label object.
     */
    new(x, y, text, xloc, yloc, color, style, textcolor, size, textalign, tooltip, text_font_family) {
      const label = new LabelObject(this.context, {
        x: Series.from(x).get(0),
        y: Series.from(y).get(0),
        text: Series.from(text).get(0),
        xloc: xloc ? Series.from(xloc).get(0) : void 0,
        yloc: yloc ? Series.from(yloc).get(0) : void 0,
        color: color ? Series.from(color).get(0) : void 0,
        style: style ? Series.from(style).get(0) : void 0,
        textcolor: textcolor ? Series.from(textcolor).get(0) : void 0,
        size: size ? Series.from(size).get(0) : void 0,
        textalign: textalign ? Series.from(textalign).get(0) : void 0,
        tooltip: tooltip ? Series.from(tooltip).get(0) : void 0,
        text_font_family: text_font_family ? Series.from(text_font_family).get(0) : void 0
      });
      this._labels.push(label);
      return label;
    }
    /**
     * Creates a copy of a label object.
     */
    copy(id) {
      const copy = id.copy();
      this._labels.push(copy);
      return copy;
    }
    /**
     * Deletes a label object.
     */
    delete(id) {
      if (id) {
        id.delete();
      }
    }
    // Getter wrappers
    get_x(id) {
      return id?.get_x() ?? NaN;
    }
    get_y(id) {
      return id?.get_y() ?? NaN;
    }
    get_text(id) {
      return id?.get_text() ?? "";
    }
    // Setter wrappers
    set_x(id, x) {
      id?.set_x(x);
    }
    set_y(id, y) {
      id?.set_y(y);
    }
    set_xy(id, x, y) {
      id?.set_xy(x, y);
    }
    set_text(id, text) {
      id?.set_text(text);
    }
    set_xloc(id, xloc) {
      id?.set_xloc(xloc);
    }
    set_yloc(id, yloc) {
      id?.set_yloc(yloc);
    }
    set_color(id, color) {
      id?.set_color(color);
    }
    set_style(id, style) {
      id?.set_style(style);
    }
    set_textcolor(id, color) {
      id?.set_textcolor(color);
    }
    set_size(id, size) {
      id?.set_size(size);
    }
    set_textalign(id, align) {
      id?.set_textalign(align);
    }
    set_tooltip(id, tooltip) {
      id?.set_tooltip(tooltip);
    }
    set_text_font_family(id, family) {
      id?.set_text_font_family(family);
    }
  }
  // Label styles
  __publicField$c(Label, "style_arrowdown", "arrowdown");
  __publicField$c(Label, "style_arrowup", "arrowup");
  __publicField$c(Label, "style_circle", "circle");
  __publicField$c(Label, "style_cross", "cross");
  __publicField$c(Label, "style_diamond", "diamond");
  __publicField$c(Label, "style_flag", "flag");
  __publicField$c(Label, "style_label_center", "label_center");
  __publicField$c(Label, "style_label_down", "label_down");
  __publicField$c(Label, "style_label_left", "label_left");
  __publicField$c(Label, "style_label_lower_left", "label_lower_left");
  __publicField$c(Label, "style_label_lower_right", "label_lower_right");
  __publicField$c(Label, "style_label_right", "label_right");
  __publicField$c(Label, "style_label_up", "label_up");
  __publicField$c(Label, "style_label_upper_left", "label_upper_left");
  __publicField$c(Label, "style_label_upper_right", "label_upper_right");
  __publicField$c(Label, "style_none", "none");
  __publicField$c(Label, "style_square", "square");
  __publicField$c(Label, "style_text_outline", "text_outline");
  __publicField$c(Label, "style_triangledown", "triangledown");
  __publicField$c(Label, "style_triangleup", "triangleup");
  __publicField$c(Label, "style_xcross", "xcross");

  var __defProp$b = Object.defineProperty;
  var __defNormalProp$b = (obj, key, value) => key in obj ? __defProp$b(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$b = (obj, key, value) => __defNormalProp$b(obj, typeof key !== "symbol" ? key + "" : key, value);
  const _LineObject = class _LineObject {
    constructor(context, options = {}) {
      this.context = context;
      __publicField$b(this, "_id");
      __publicField$b(this, "_x1");
      __publicField$b(this, "_y1");
      __publicField$b(this, "_x2");
      __publicField$b(this, "_y2");
      __publicField$b(this, "_xloc");
      __publicField$b(this, "_extend");
      __publicField$b(this, "_color");
      __publicField$b(this, "_style");
      __publicField$b(this, "_width");
      this._id = _LineObject._nextId++;
      this._x1 = options.x1 ?? 0;
      this._y1 = options.y1 ?? 0;
      this._x2 = options.x2 ?? 0;
      this._y2 = options.y2 ?? 0;
      this._xloc = options.xloc ?? "bar_index";
      this._extend = options.extend ?? "none";
      this._color = options.color ?? "#2196F3";
      this._style = options.style ?? "solid";
      this._width = options.width ?? 1;
    }
    // Getters
    get_x1() {
      return this._x1;
    }
    get_y1() {
      return this._y1;
    }
    get_x2() {
      return this._x2;
    }
    get_y2() {
      return this._y2;
    }
    get_price(x) {
      const x1 = this._x1;
      const y1 = this._y1;
      const x2 = this._x2;
      const y2 = this._y2;
      if (x2 === x1) return y1;
      const slope = (y2 - y1) / (x2 - x1);
      return y1 + slope * (x - x1);
    }
    // Setters
    set_x1(x1) {
      this._x1 = Series.from(x1).get(0);
    }
    set_y1(y1) {
      this._y1 = Series.from(y1).get(0);
    }
    set_x2(x2) {
      this._x2 = Series.from(x2).get(0);
    }
    set_y2(y2) {
      this._y2 = Series.from(y2).get(0);
    }
    set_xy1(x, y) {
      this._x1 = Series.from(x).get(0);
      this._y1 = Series.from(y).get(0);
    }
    set_xy2(x, y) {
      this._x2 = Series.from(x).get(0);
      this._y2 = Series.from(y).get(0);
    }
    set_first_point(point) {
      if (this._xloc === "bar_time") {
        this._x1 = point.time;
      } else {
        this._x1 = point.index;
      }
      this._y1 = point.price;
    }
    set_second_point(point) {
      if (this._xloc === "bar_time") {
        this._x2 = point.time;
      } else {
        this._x2 = point.index;
      }
      this._y2 = point.price;
    }
    set_xloc(xloc) {
      this._xloc = Series.from(xloc).get(0);
    }
    set_extend(extend) {
      this._extend = Series.from(extend).get(0);
    }
    set_color(color) {
      this._color = Series.from(color).get(0);
    }
    set_style(style) {
      this._style = Series.from(style).get(0);
    }
    set_width(width) {
      this._width = Series.from(width).get(0);
    }
    /**
     * Returns a copy of this line object
     */
    copy() {
      return new _LineObject(this.context, {
        x1: this._x1,
        y1: this._y1,
        x2: this._x2,
        y2: this._y2,
        xloc: this._xloc,
        extend: this._extend,
        color: this._color,
        style: this._style,
        width: this._width
      });
    }
    /**
     * Deletes the line (removes from rendering)
     */
    delete() {
      this._deleted = true;
    }
    /**
     * Gets the line's properties for rendering
     */
    toJSON() {
      return {
        id: this._id,
        x1: this._x1,
        y1: this._y1,
        x2: this._x2,
        y2: this._y2,
        xloc: this._xloc,
        extend: this._extend,
        color: this._color,
        style: this._style,
        width: this._width
      };
    }
  };
  __publicField$b(_LineObject, "_nextId", 1);
  let LineObject = _LineObject;

  var __defProp$a = Object.defineProperty;
  var __defNormalProp$a = (obj, key, value) => key in obj ? __defProp$a(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$a = (obj, key, value) => __defNormalProp$a(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Line {
    constructor(context) {
      this.context = context;
      __publicField$a(this, "_lines", []);
    }
    /**
     * Helper method to unwrap Series values
     */
    param(source, index = 0) {
      return Series.from(source).get(index);
    }
    /**
     * Returns an array of all line objects on the chart.
     */
    get all() {
      return this._lines.filter((l) => !l._deleted);
    }
    /**
     * Creates a new line object.
     */
    new(x1, y1, x2, y2, xloc, extend, color, style, width) {
      const line = new LineObject(this.context, {
        x1: Series.from(x1).get(0),
        y1: Series.from(y1).get(0),
        x2: Series.from(x2).get(0),
        y2: Series.from(y2).get(0),
        xloc: xloc ? Series.from(xloc).get(0) : void 0,
        extend: extend ? Series.from(extend).get(0) : void 0,
        color: color ? Series.from(color).get(0) : void 0,
        style: style ? Series.from(style).get(0) : void 0,
        width: width ? Series.from(width).get(0) : void 0
      });
      this._lines.push(line);
      return line;
    }
    /**
     * Creates a copy of a line object.
     */
    copy(id) {
      const copy = id.copy();
      this._lines.push(copy);
      return copy;
    }
    /**
     * Deletes a line object.
     */
    delete(id) {
      if (id) {
        id.delete();
      }
    }
    // Getter wrappers
    get_x1(id) {
      return id?.get_x1() ?? NaN;
    }
    get_y1(id) {
      return id?.get_y1() ?? NaN;
    }
    get_x2(id) {
      return id?.get_x2() ?? NaN;
    }
    get_y2(id) {
      return id?.get_y2() ?? NaN;
    }
    get_price(id, x) {
      return id?.get_price(Series.from(x).get(0)) ?? NaN;
    }
    // Setter wrappers
    set_x1(id, x1) {
      id?.set_x1(x1);
    }
    set_y1(id, y1) {
      id?.set_y1(y1);
    }
    set_x2(id, x2) {
      id?.set_x2(x2);
    }
    set_y2(id, y2) {
      id?.set_y2(y2);
    }
    set_xy1(id, x, y) {
      id?.set_xy1(x, y);
    }
    set_xy2(id, x, y) {
      id?.set_xy2(x, y);
    }
    set_first_point(id, point) {
      id?.set_first_point(point);
    }
    set_second_point(id, point) {
      id?.set_second_point(point);
    }
    set_xloc(id, xloc) {
      id?.set_xloc(xloc);
    }
    set_extend(id, extend) {
      id?.set_extend(extend);
    }
    set_color(id, color) {
      id?.set_color(color);
    }
    set_style(id, style) {
      id?.set_style(style);
    }
    set_width(id, width) {
      id?.set_width(width);
    }
  }
  // Line styles
  __publicField$a(Line, "style_arrow_both", "arrow_both");
  __publicField$a(Line, "style_arrow_left", "arrow_left");
  __publicField$a(Line, "style_arrow_right", "arrow_right");
  __publicField$a(Line, "style_dashed", "dashed");
  __publicField$a(Line, "style_dotted", "dotted");
  __publicField$a(Line, "style_solid", "solid");

  var __defProp$9 = Object.defineProperty;
  var __defNormalProp$9 = (obj, key, value) => key in obj ? __defProp$9(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$9 = (obj, key, value) => __defNormalProp$9(obj, typeof key !== "symbol" ? key + "" : key, value);
  const _LinefillObject = class _LinefillObject {
    constructor(context, options) {
      this.context = context;
      __publicField$9(this, "_id");
      __publicField$9(this, "_line1");
      __publicField$9(this, "_line2");
      __publicField$9(this, "_color");
      this._id = _LinefillObject._nextId++;
      this._line1 = options.line1;
      this._line2 = options.line2;
      this._color = options.color ?? "rgba(33, 150, 243, 0.5)";
    }
    // Getters
    get_line1() {
      return this._line1;
    }
    get_line2() {
      return this._line2;
    }
    // Setters
    set_color(color) {
      this._color = Series.from(color).get(0);
    }
    /**
     * Deletes the linefill (removes from rendering)
     */
    delete() {
      this._deleted = true;
    }
    /**
     * Gets the linefill's properties for rendering
     */
    toJSON() {
      return {
        id: this._id,
        line1: this._line1?.toJSON(),
        line2: this._line2?.toJSON(),
        color: this._color
      };
    }
  };
  __publicField$9(_LinefillObject, "_nextId", 1);
  let LinefillObject = _LinefillObject;

  var __defProp$8 = Object.defineProperty;
  var __defNormalProp$8 = (obj, key, value) => key in obj ? __defProp$8(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$8 = (obj, key, value) => __defNormalProp$8(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Linefill {
    constructor(context) {
      this.context = context;
      __publicField$8(this, "_linefills", []);
    }
    /**
     * Helper method to unwrap Series values
     */
    param(source, index = 0) {
      return Series.from(source).get(index);
    }
    /**
     * Returns an array of all linefill objects on the chart.
     */
    get all() {
      return this._linefills.filter((l) => !l._deleted);
    }
    /**
     * Creates a new linefill object.
     */
    new(line1, line2, color) {
      const linefill = new LinefillObject(this.context, {
        line1,
        line2,
        color: color ? Series.from(color).get(0) : void 0
      });
      this._linefills.push(linefill);
      return linefill;
    }
    /**
     * Deletes a linefill object.
     */
    delete(id) {
      if (id) {
        id.delete();
      }
    }
    // Getter wrappers
    get_line1(id) {
      return id?.get_line1() ?? null;
    }
    get_line2(id) {
      return id?.get_line2() ?? null;
    }
    // Setter wrapper
    set_color(id, color) {
      id?.set_color(color);
    }
  }

  var __defProp$7 = Object.defineProperty;
  var __defNormalProp$7 = (obj, key, value) => key in obj ? __defProp$7(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$7 = (obj, key, value) => __defNormalProp$7(obj, typeof key !== "symbol" ? key + "" : key, value);
  const _PolylineObject = class _PolylineObject {
    constructor(context, options = {}) {
      this.context = context;
      __publicField$7(this, "_id");
      __publicField$7(this, "_points");
      __publicField$7(this, "_curved");
      __publicField$7(this, "_closed");
      __publicField$7(this, "_xloc");
      __publicField$7(this, "_line_color");
      __publicField$7(this, "_fill_color");
      __publicField$7(this, "_line_style");
      __publicField$7(this, "_line_width");
      this._id = _PolylineObject._nextId++;
      this._points = options.points ?? [];
      this._curved = options.curved ?? false;
      this._closed = options.closed ?? false;
      this._xloc = options.xloc ?? "bar_index";
      this._line_color = options.line_color ?? "#2196F3";
      this._fill_color = options.fill_color ?? "";
      this._line_style = options.line_style ?? "solid";
      this._line_width = options.line_width ?? 1;
    }
    /**
     * Deletes the polyline (removes from rendering)
     */
    delete() {
      this._deleted = true;
    }
    /**
     * Gets the polyline's properties for rendering
     */
    toJSON() {
      return {
        id: this._id,
        points: this._points,
        curved: this._curved,
        closed: this._closed,
        xloc: this._xloc,
        line_color: this._line_color,
        fill_color: this._fill_color,
        line_style: this._line_style,
        line_width: this._line_width
      };
    }
  };
  __publicField$7(_PolylineObject, "_nextId", 1);
  let PolylineObject = _PolylineObject;

  var __defProp$6 = Object.defineProperty;
  var __defNormalProp$6 = (obj, key, value) => key in obj ? __defProp$6(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$6 = (obj, key, value) => __defNormalProp$6(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Polyline {
    constructor(context) {
      this.context = context;
      __publicField$6(this, "_polylines", []);
    }
    /**
     * Helper method to unwrap Series values
     */
    param(source, index = 0) {
      return Series.from(source).get(index);
    }
    /**
     * Returns an array of all polyline objects on the chart.
     */
    get all() {
      return this._polylines.filter((p) => !p._deleted);
    }
    /**
     * Creates a new polyline object.
     */
    new(points, curved, closed, xloc, line_color, fill_color, line_style, line_width) {
      const polyline = new PolylineObject(this.context, {
        points,
        curved: curved !== void 0 ? Series.from(curved).get(0) : void 0,
        closed: closed !== void 0 ? Series.from(closed).get(0) : void 0,
        xloc: xloc ? Series.from(xloc).get(0) : void 0,
        line_color: line_color ? Series.from(line_color).get(0) : void 0,
        fill_color: fill_color ? Series.from(fill_color).get(0) : void 0,
        line_style: line_style ? Series.from(line_style).get(0) : void 0,
        line_width: line_width ? Series.from(line_width).get(0) : void 0
      });
      this._polylines.push(polyline);
      return polyline;
    }
    /**
     * Deletes a polyline object.
     */
    delete(id) {
      if (id) {
        id.delete();
      }
    }
  }

  var __defProp$5 = Object.defineProperty;
  var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$5 = (obj, key, value) => __defNormalProp$5(obj, typeof key !== "symbol" ? key + "" : key, value);
  const _TableObject = class _TableObject {
    constructor(context, options = {}) {
      this.context = context;
      __publicField$5(this, "_id");
      __publicField$5(this, "_position");
      __publicField$5(this, "_columns");
      __publicField$5(this, "_rows");
      __publicField$5(this, "_bgcolor");
      __publicField$5(this, "_frame_color");
      __publicField$5(this, "_frame_width");
      __publicField$5(this, "_border_color");
      __publicField$5(this, "_border_width");
      __publicField$5(this, "_cells");
      this._id = _TableObject._nextId++;
      this._position = options.position ?? "top_right";
      this._columns = options.columns ?? 1;
      this._rows = options.rows ?? 1;
      this._bgcolor = options.bgcolor ?? "#000000";
      this._frame_color = options.frame_color ?? "#000000";
      this._frame_width = options.frame_width ?? 0;
      this._border_color = options.border_color ?? "#000000";
      this._border_width = options.border_width ?? 0;
      this._cells = /* @__PURE__ */ new Map();
    }
    _getCellKey(column, row) {
      return `${column},${row}`;
    }
    /**
     * Sets the content of a cell.
     */
    cell(column, row, text = "", width = 0, height = 0, text_color = "#FFFFFF", text_halign = "center", text_valign = "center", text_size = "normal", bgcolor = "", tooltip = "", text_font_family = "default") {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      this._cells.set(key, {
        text: Series.from(text).get(0),
        width: Series.from(width).get(0),
        height: Series.from(height).get(0),
        text_color: Series.from(text_color).get(0),
        text_halign: Series.from(text_halign).get(0),
        text_valign: Series.from(text_valign).get(0),
        text_size: Series.from(text_size).get(0),
        text_font_family: Series.from(text_font_family).get(0),
        bgcolor: Series.from(bgcolor).get(0),
        tooltip: Series.from(tooltip).get(0)
      });
    }
    cell_set_text(column, row, text) {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      const cell = this._cells.get(key);
      if (cell) {
        cell.text = Series.from(text).get(0);
      }
    }
    cell_set_text_color(column, row, color) {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      const cell = this._cells.get(key);
      if (cell) {
        cell.text_color = Series.from(color).get(0);
      }
    }
    cell_set_text_halign(column, row, halign) {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      const cell = this._cells.get(key);
      if (cell) {
        cell.text_halign = Series.from(halign).get(0);
      }
    }
    cell_set_text_valign(column, row, valign) {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      const cell = this._cells.get(key);
      if (cell) {
        cell.text_valign = Series.from(valign).get(0);
      }
    }
    cell_set_text_size(column, row, size) {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      const cell = this._cells.get(key);
      if (cell) {
        cell.text_size = Series.from(size).get(0);
      }
    }
    cell_set_text_font_family(column, row, family) {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      const cell = this._cells.get(key);
      if (cell) {
        cell.text_font_family = Series.from(family).get(0);
      }
    }
    cell_set_bgcolor(column, row, color) {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      const cell = this._cells.get(key);
      if (cell) {
        cell.bgcolor = Series.from(color).get(0);
      }
    }
    cell_set_width(column, row, width) {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      const cell = this._cells.get(key);
      if (cell) {
        cell.width = Series.from(width).get(0);
      }
    }
    cell_set_height(column, row, height) {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      const cell = this._cells.get(key);
      if (cell) {
        cell.height = Series.from(height).get(0);
      }
    }
    cell_set_tooltip(column, row, tooltip) {
      const key = this._getCellKey(
        Series.from(column).get(0),
        Series.from(row).get(0)
      );
      const cell = this._cells.get(key);
      if (cell) {
        cell.tooltip = Series.from(tooltip).get(0);
      }
    }
    /**
     * Merges cells in a range.
     */
    merge_cells(start_column, start_row, end_column, end_row) {
    }
    /**
     * Clears the table.
     */
    clear(start_column = 0, start_row = 0, end_column, end_row) {
      const endCol = end_column ?? this._columns - 1;
      const endRow = end_row ?? this._rows - 1;
      for (let c = start_column; c <= endCol; c++) {
        for (let r = start_row; r <= endRow; r++) {
          const key = this._getCellKey(c, r);
          this._cells.delete(key);
        }
      }
    }
    // Setters
    set_position(position) {
      this._position = Series.from(position).get(0);
    }
    set_bgcolor(color) {
      this._bgcolor = Series.from(color).get(0);
    }
    set_frame_color(color) {
      this._frame_color = Series.from(color).get(0);
    }
    set_frame_width(width) {
      this._frame_width = Series.from(width).get(0);
    }
    set_border_color(color) {
      this._border_color = Series.from(color).get(0);
    }
    set_border_width(width) {
      this._border_width = Series.from(width).get(0);
    }
    /**
     * Deletes the table (removes from rendering)
     */
    delete() {
      this._deleted = true;
    }
    /**
     * Gets the table's properties for rendering
     */
    toJSON() {
      const cells = [];
      this._cells.forEach((cell, key) => {
        const [col, row] = key.split(",").map(Number);
        cells.push({ column: col, row, ...cell });
      });
      return {
        id: this._id,
        position: this._position,
        columns: this._columns,
        rows: this._rows,
        bgcolor: this._bgcolor,
        frame_color: this._frame_color,
        frame_width: this._frame_width,
        border_color: this._border_color,
        border_width: this._border_width,
        cells
      };
    }
  };
  __publicField$5(_TableObject, "_nextId", 1);
  let TableObject = _TableObject;

  var __defProp$4 = Object.defineProperty;
  var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$4 = (obj, key, value) => __defNormalProp$4(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Table {
    constructor(context) {
      this.context = context;
      __publicField$4(this, "_tables", []);
    }
    /**
     * Helper method to unwrap Series values
     */
    param(source, index = 0) {
      return Series.from(source).get(index);
    }
    /**
     * Returns an array of all table objects on the chart.
     */
    get all() {
      return this._tables.filter((t) => !t._deleted);
    }
    /**
     * Creates a new table object.
     */
    new(position, columns, rows, bgcolor, frame_color, frame_width, border_color, border_width) {
      const table = new TableObject(this.context, {
        position: Series.from(position).get(0),
        columns: Series.from(columns).get(0),
        rows: Series.from(rows).get(0),
        bgcolor: bgcolor ? Series.from(bgcolor).get(0) : void 0,
        frame_color: frame_color ? Series.from(frame_color).get(0) : void 0,
        frame_width: frame_width ? Series.from(frame_width).get(0) : void 0,
        border_color: border_color ? Series.from(border_color).get(0) : void 0,
        border_width: border_width ? Series.from(border_width).get(0) : void 0
      });
      this._tables.push(table);
      return table;
    }
    /**
     * Deletes a table object.
     */
    delete(id) {
      if (id) {
        id.delete();
      }
    }
    /**
     * Sets the content of a cell.
     */
    cell(id, column, row, text, width, height, text_color, text_halign, text_valign, text_size, bgcolor, tooltip, text_font_family) {
      id?.cell(
        column,
        row,
        text,
        width,
        height,
        text_color,
        text_halign,
        text_valign,
        text_size,
        bgcolor,
        tooltip,
        text_font_family
      );
    }
    cell_set_text(id, column, row, text) {
      id?.cell_set_text(column, row, text);
    }
    cell_set_text_color(id, column, row, color) {
      id?.cell_set_text_color(column, row, color);
    }
    cell_set_text_halign(id, column, row, halign) {
      id?.cell_set_text_halign(column, row, halign);
    }
    cell_set_text_valign(id, column, row, valign) {
      id?.cell_set_text_valign(column, row, valign);
    }
    cell_set_text_size(id, column, row, size) {
      id?.cell_set_text_size(column, row, size);
    }
    cell_set_text_font_family(id, column, row, family) {
      id?.cell_set_text_font_family(column, row, family);
    }
    cell_set_bgcolor(id, column, row, color) {
      id?.cell_set_bgcolor(column, row, color);
    }
    cell_set_width(id, column, row, width) {
      id?.cell_set_width(column, row, width);
    }
    cell_set_height(id, column, row, height) {
      id?.cell_set_height(column, row, height);
    }
    cell_set_tooltip(id, column, row, tooltip) {
      id?.cell_set_tooltip(column, row, tooltip);
    }
    merge_cells(id, start_column, start_row, end_column, end_row) {
      id?.merge_cells(start_column, start_row, end_column, end_row);
    }
    clear(id, start_column, start_row, end_column, end_row) {
      id?.clear(start_column, start_row, end_column, end_row);
    }
    set_position(id, position) {
      id?.set_position(position);
    }
    set_bgcolor(id, color) {
      id?.set_bgcolor(color);
    }
    set_frame_color(id, color) {
      id?.set_frame_color(color);
    }
    set_frame_width(id, width) {
      id?.set_frame_width(width);
    }
    set_border_color(id, color) {
      id?.set_border_color(color);
    }
    set_border_width(id, width) {
      id?.set_border_width(width);
    }
  }

  const PLOT_SIGNATURE = [
    "series",
    "title",
    "color",
    "linewidth",
    "style",
    "trackprice",
    "histbase",
    "offset",
    "join",
    "editable",
    "show_last",
    "display",
    "format",
    "precision",
    "force_overlay"
  ];
  const PLOT_SHAPE_SIGNATURE = [
    "series",
    "title",
    "style",
    "location",
    "color",
    "offset",
    "text",
    "textcolor",
    "editable",
    "size",
    "show_last",
    "display",
    "format",
    "precision",
    "force_overlay"
  ];
  const PLOT_ARROW_SIGNATURE = [
    "series",
    "title",
    "colorup",
    "colordown",
    "offset",
    "minheight",
    "maxheight",
    "editable",
    "show_last",
    "display",
    "format",
    "precision",
    "force_overlay"
  ];
  const PLOTBAR_SIGNATURE = [
    "open",
    "high",
    "low",
    "close",
    "title",
    "color",
    "editable",
    "show_last",
    "display",
    "format",
    "precision",
    "force_overlay"
  ];
  const PLOTCANDLE_SIGNATURE = [
    "open",
    "high",
    "low",
    "close",
    "title",
    "color",
    "wickcolor",
    "editable",
    "show_last",
    "bordercolor",
    "display",
    "format",
    "precision",
    "force_overlay"
  ];
  const BGCOLOR_SIGNATURE = [
    "color",
    "offset",
    "editable",
    "show_last",
    "title",
    "display",
    "force_overlay"
  ];
  const FILL_SIGNATURE = [
    "plot1",
    "plot2",
    "color",
    "title",
    "editable",
    "show_last",
    "fillgaps",
    "display"
  ];
  const PLOT_ARGS_TYPES = {
    series: "series",
    title: "string",
    color: "string",
    linewidth: "number",
    style: "string",
    trackprice: "boolean",
    histbase: "number",
    offset: "number",
    join: "bool",
    editable: "boolean",
    show_last: "number",
    display: "string",
    format: "string",
    precision: "number",
    force_overlay: "boolean"
  };
  const PLOT_SHAPE_ARGS_TYPES = {
    series: "series",
    title: "string",
    style: "string",
    location: "string",
    color: "string",
    offset: "number",
    text: "string",
    textcolor: "string",
    editable: "boolean",
    size: "string",
    show_last: "number",
    display: "string",
    format: "string",
    precision: "number",
    force_overlay: "boolean"
  };
  const PLOT_ARROW_ARGS_TYPES = {
    series: "series",
    title: "string",
    colorup: "string",
    colordown: "string",
    offset: "number",
    minheight: "number",
    maxheight: "number",
    editable: "boolean",
    show_last: "number",
    display: "string",
    format: "string",
    precision: "number",
    force_overlay: "boolean"
  };
  const PLOTBAR_ARGS_TYPES = {
    open: "series",
    high: "series",
    low: "series",
    close: "series",
    title: "string",
    color: "string",
    editable: "boolean",
    show_last: "number",
    display: "string",
    format: "string",
    precision: "number",
    force_overlay: "boolean"
  };
  const PLOTCANDLE_ARGS_TYPES = {
    open: "series",
    high: "series",
    low: "series",
    close: "series",
    title: "string",
    color: "string",
    wickcolor: "string",
    bordercolor: "string",
    editable: "boolean",
    show_last: "number",
    display: "string",
    format: "string",
    precision: "number",
    force_overlay: "boolean"
  };
  const BGCOLOR_ARGS_TYPES = {
    color: "string",
    offset: "number",
    editable: "boolean",
    show_last: "number",
    title: "string",
    display: "string",
    force_overlay: "boolean"
  };
  const FILL_ARGS_TYPES = {
    plot1: "object",
    plot2: "object",
    color: "string",
    title: "string",
    editable: "boolean",
    show_last: "number",
    fillgaps: "boolean",
    display: "string"
  };
  class PlotHelper {
    constructor(context) {
      this.context = context;
    }
    extractPlotOptions(options) {
      const _options = {};
      for (let key in options) {
        _options[key] = Series.from(options[key]).get(0);
      }
      return _options;
    }
    get linestyle_dashed() {
      return "linestyle_dashed";
    }
    get linestyle_dotted() {
      return "linestyle_dotted";
    }
    get linestyle_solid() {
      return "linestyle_solid";
    }
    get style_area() {
      return "style_area";
    }
    get style_areabr() {
      return "style_areabr";
    }
    get style_circles() {
      return "style_circles";
    }
    get style_columns() {
      return "style_columns";
    }
    get style_cross() {
      return "style_cross";
    }
    get style_histogram() {
      return "style_histogram";
    }
    get style_line() {
      return "style_line";
    }
    get style_linebr() {
      return "style_linebr";
    }
    get style_stepline() {
      return "style_stepline";
    }
    get style_stepline_diamond() {
      return "style_stepline_diamond";
    }
    get style_steplinebr() {
      return "style_steplinebr";
    }
    param(source, index = 0, name) {
      return Series.from(source).get(index);
    }
    //in the current implementation, plot functions are only used to collect data for the plots array and map it to the market data
    plotchar(...args) {
      const _parsed = parseArgsForPineParams(args, PLOT_SIGNATURE, PLOT_ARGS_TYPES);
      const { series, title, ...others } = _parsed;
      const options = this.extractPlotOptions(others);
      if (!this.context.plots[title]) {
        this.context.plots[title] = { data: [], options: { ...options, style: "char" }, title };
      }
      const value = Series.from(series).get(0);
      this.context.plots[title].data.push({
        title,
        time: this.context.marketData[this.context.idx].openTime,
        value
      });
      return this.context.plots[title];
    }
    //this will map to plot() - see README.md for more details
    any(...args) {
      const _parsed = parseArgsForPineParams(args, PLOT_SIGNATURE, PLOT_ARGS_TYPES);
      const { series, title, ...others } = _parsed;
      const options = this.extractPlotOptions(others);
      if (!this.context.plots[title]) {
        const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
        this.context.plots[title] = { data: [], options: { ...options, overlay }, title };
      }
      const value = Series.from(series).get(0);
      this.context.plots[title].data.push({
        title,
        time: this.context.marketData[this.context.idx].openTime,
        value,
        options: { color: options.color, offset: options.offset }
      });
      return this.context.plots[title];
    }
    plotshape(...args) {
      const _parsed = parseArgsForPineParams(args, PLOT_SHAPE_SIGNATURE, PLOT_SHAPE_ARGS_TYPES);
      const { series, title, ...others } = _parsed;
      const options = this.extractPlotOptions(others);
      if (!this.context.plots[title]) {
        const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
        this.context.plots[title] = {
          data: [],
          options: { ...options, style: "shape", shape: options.style, overlay },
          title
        };
      }
      const value = Series.from(series).get(0);
      this.context.plots[title].data.push({
        title,
        time: this.context.marketData[this.context.idx].openTime,
        value,
        options: options?.location === "absolute" || value ? {
          text: options.text,
          textcolor: options.textcolor,
          color: options.color,
          offset: options.offset,
          shape: options.style,
          location: options.location,
          size: options.size
        } : void 0
      });
      return this.context.plots[title];
    }
    plotarrow(...args) {
      const _parsed = parseArgsForPineParams(args, PLOT_ARROW_SIGNATURE, PLOT_ARROW_ARGS_TYPES);
      const { series, title, ...others } = _parsed;
      const value = Series.from(series).get(0);
      const options = this.extractPlotOptions(others);
      if (!this.context.plots[title]) {
        const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
        this.context.plots[title] = { data: [], options: { ...options, style: "shape", overlay }, title };
      }
      this.context.plots[title].data.push({
        title,
        time: this.context.marketData[this.context.idx].openTime,
        value,
        options: typeof value === "number" && !isNaN(value) && value !== 0 ? {
          text: void 0,
          textcolor: void 0,
          color: value > 0 ? options.colorup : options.colordown,
          offset: options.offset,
          shape: value > 0 ? "arrowup" : "arrowdown",
          location: value > 0 ? "belowbar" : "abovebar",
          height: options.maxheight
        } : void 0
      });
      return this.context.plots[title];
    }
    plotbar(...args) {
      const _parsed = parseArgsForPineParams(args, PLOTBAR_SIGNATURE, PLOTBAR_ARGS_TYPES);
      const { open, high, low, close, title, ...others } = _parsed;
      const options = this.extractPlotOptions(others);
      if (!this.context.plots[title]) {
        const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
        this.context.plots[title] = { data: [], options: { ...options, style: "bar", overlay }, title };
      }
      const value = [Series.from(open).get(0), Series.from(high).get(0), Series.from(low).get(0), Series.from(close).get(0)];
      this.context.plots[title].data.push({
        title,
        time: this.context.marketData[this.context.idx].openTime,
        value,
        options: { color: options.color }
      });
    }
    plotcandle(...args) {
      const _parsed = parseArgsForPineParams(args, PLOTCANDLE_SIGNATURE, PLOTCANDLE_ARGS_TYPES);
      const { open, high, low, close, title, ...others } = _parsed;
      const options = this.extractPlotOptions(others);
      if (!this.context.plots[title]) {
        const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
        this.context.plots[title] = { data: [], options: { ...options, style: "candle", overlay }, title };
      }
      const value = [Series.from(open).get(0), Series.from(high).get(0), Series.from(low).get(0), Series.from(close).get(0)];
      this.context.plots[title].data.push({
        title,
        time: this.context.marketData[this.context.idx].openTime,
        value,
        options: { color: options.color, wickcolor: options.wickcolor, bordercolor: options.bordercolor }
      });
      return this.context.plots[title];
    }
    bgcolor(...args) {
      const _parsed = parseArgsForPineParams(args, BGCOLOR_SIGNATURE, BGCOLOR_ARGS_TYPES);
      const { title, ...others } = _parsed;
      const options = this.extractPlotOptions(others);
      if (!this.context.plots[title]) {
        const overlay = options.force_overlay ?? (this.context?.indicator?.overlay || false);
        this.context.plots[title] = { data: [], options: { ...options, style: "background", overlay }, title };
      }
      this.context.plots[title].data.push({
        title,
        time: this.context.marketData[this.context.idx].openTime,
        value: options.color && options.color !== "na" && options?.color.toString() !== "NaN",
        options: { color: options.color }
      });
    }
    barcolor(...args) {
      const _parsed = parseArgsForPineParams(args, BGCOLOR_SIGNATURE, BGCOLOR_ARGS_TYPES);
      const { title, ...others } = _parsed;
      const options = this.extractPlotOptions(others);
      if (!this.context.plots[title]) {
        this.context.plots[title] = { data: [], options: { ...options, style: "barcolor" }, title };
      }
      this.context.plots[title].data.push({
        title,
        time: this.context.marketData[this.context.idx].openTime,
        value: options.color && options.color !== "na" && options?.color.toString() !== "NaN",
        options: { color: options.color }
      });
      return this.context.plots[title];
    }
  }
  class HlineHelper {
    constructor(context) {
      this.context = context;
    }
    get style_dashed() {
      return "dashed";
    }
    get style_solid() {
      return "solid";
    }
    get style_dotted() {
      return "dotted";
    }
    param(source, index = 0, name) {
      return Series.from(source).get(index);
    }
    //this will map to hline()
    any(price, title, color, linestyle, linewidth, editable, display) {
      return this.context.pine.plot.any(price, { title, color, linestyle, linewidth, editable, display });
    }
  }
  class FillHelper {
    constructor(context) {
      this.context = context;
    }
    param(source, index = 0, name) {
      return Series.from(source).get(index);
    }
    any(...args) {
      const _parsed = parseArgsForPineParams(args, FILL_SIGNATURE, FILL_ARGS_TYPES);
      const { plot1, plot2, color, title, editable, show_last, fillgaps, display } = _parsed;
      if (!this.context.plots[title]) {
        this.context.plots[title] = {
          title,
          plot1: plot1.title,
          plot2: plot2.title,
          options: { color, editable, show_last, fillgaps, display, style: "fill" }
        };
      }
    }
  }

  var __defProp$3 = Object.defineProperty;
  var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$3 = (obj, key, value) => __defNormalProp$3(obj, typeof key !== "symbol" ? key + "" : key, value);
  const _Context = class _Context {
    constructor({
      marketData,
      source,
      tickerId,
      timeframe,
      limit,
      sDate,
      eDate,
      fullContext,
      inputs
    }) {
      __publicField$3(this, "data", {
        open: new Series([]),
        high: new Series([]),
        low: new Series([]),
        close: new Series([]),
        volume: new Series([]),
        hl2: new Series([]),
        hlc3: new Series([]),
        ohlc4: new Series([]),
        hlcc4: new Series([])
      });
      __publicField$3(this, "indicator");
      __publicField$3(this, "cache", {});
      __publicField$3(this, "taState", {});
      // State for incremental TA calculations
      __publicField$3(this, "isSecondaryContext", false);
      // Flag to prevent infinite recursion in request.security
      __publicField$3(this, "NA", NaN);
      __publicField$3(this, "lang");
      // Combined namespace and core functions - the default way to access everything
      __publicField$3(this, "pine");
      __publicField$3(this, "idx", 0);
      __publicField$3(this, "params", {});
      __publicField$3(this, "const", {});
      __publicField$3(this, "var", {});
      __publicField$3(this, "let", {});
      __publicField$3(this, "result");
      __publicField$3(this, "plots", {});
      __publicField$3(this, "marketData");
      __publicField$3(this, "source");
      __publicField$3(this, "tickerId");
      __publicField$3(this, "timeframe", "");
      __publicField$3(this, "limit");
      __publicField$3(this, "sDate");
      __publicField$3(this, "eDate");
      __publicField$3(this, "fullContext");
      __publicField$3(this, "pineTSCode");
      __publicField$3(this, "inputs", {});
      //#region [Call Stack Management] ===========================
      __publicField$3(this, "_callStack", []);
      this.marketData = marketData;
      this.source = source;
      this.tickerId = tickerId;
      this.timeframe = timeframe;
      this.limit = limit;
      this.sDate = sDate;
      this.eDate = eDate;
      this.fullContext = fullContext || this;
      this.inputs = inputs || {};
      const core = new Core(this);
      const coreFunctions = {
        Type: core.Type.bind(core),
        na: core.na.bind(core),
        color: core.color,
        nz: core.nz.bind(core),
        indicator: core.indicator.bind(core),
        fixnan: core.fixnan.bind(core),
        alertcondition: core.alertcondition.bind(core),
        alert: core.alert.bind(core),
        //types
        bool: core.bool.bind(core),
        int: core.int.bind(core),
        float: core.float.bind(core),
        string: core.string.bind(core),
        // Time functions
        timestamp: core.timestamp.bind(core),
        dayofmonth: core.dayofmonth.bind(core),
        dayofweek: core.dayofweek.bind(core),
        hour: core.hour.bind(core),
        minute: core.minute.bind(core),
        second: core.second.bind(core),
        month: core.month.bind(core),
        year: core.year.bind(core),
        weekofyear: core.weekofyear.bind(core),
        // Runtime and utility functions
        runtime: core.runtime,
        library: core.library.bind(core),
        max_bars_back: core.max_bars_back.bind(core)
      };
      const _this = this;
      this.pine = {
        input: new Input(this),
        ta: new TechnicalAnalysis(this),
        math: new PineMath(this),
        request: new PineRequest(this),
        array: new PineArray(this),
        map: new PineMap(this),
        matrix: new PineMatrix(this),
        strategy: new PineStrategy(this),
        syminfo: new Syminfo(this),
        timeframe: new Timeframe(this),
        ticker: new Ticker(this),
        chart: new Chart(this),
        session: new Session(this),
        // Drawing objects
        box: new Box(this),
        label: new Label(this),
        line: new Line(this),
        linefill: new Linefill(this),
        polyline: new Polyline(this),
        table: new Table(this),
        //FIXME : this is a temporary solution to get the barstate values,
        //we need to implement a better way to handle realtime states
        barstate: new Barstate(this),
        get bar_index() {
          return _this.idx;
        },
        get last_bar_index() {
          return _this.data.close.length - 1;
        },
        get last_bar_time() {
          return _this.data.openTime.get(_this.data.openTime.length - 1);
        },
        get timenow() {
          return (/* @__PURE__ */ new Date()).getTime();
        },
        get inputs() {
          return _this.inputs;
        },
        // Market data variables
        get open() {
          return _this.data.open ? _this.data.open.get(0) : NaN;
        },
        get high() {
          return _this.data.high ? _this.data.high.get(0) : NaN;
        },
        get low() {
          return _this.data.low ? _this.data.low.get(0) : NaN;
        },
        get close() {
          return _this.data.close ? _this.data.close.get(0) : NaN;
        },
        get volume() {
          return _this.data.volume ? _this.data.volume.get(0) : NaN;
        },
        get hl2() {
          return _this.data.hl2 ? _this.data.hl2.get(0) : NaN;
        },
        get hlc3() {
          return _this.data.hlc3 ? _this.data.hlc3.get(0) : NaN;
        },
        get ohlc4() {
          return _this.data.ohlc4 ? _this.data.ohlc4.get(0) : NaN;
        },
        get hlcc4() {
          return _this.data.hlcc4 ? _this.data.hlcc4.get(0) : NaN;
        },
        // Bid/Ask - not typically available in historical data, return NaN
        get ask() {
          return _this.data.ask ? _this.data.ask.get(0) : NaN;
        },
        get bid() {
          return _this.data.bid ? _this.data.bid.get(0) : NaN;
        },
        // Time variables - return current bar's time values
        get time() {
          return _this.data.openTime ? _this.data.openTime.get(0) : NaN;
        },
        get time_close() {
          return _this.data.closeTime ? _this.data.closeTime.get(0) : NaN;
        },
        get time_tradingday() {
          const time = _this.data.openTime ? _this.data.openTime.get(0) : NaN;
          if (isNaN(time)) return NaN;
          const date = new Date(time);
          date.setUTCHours(0, 0, 0, 0);
          return date.getTime();
        },
        // Note: dayofmonth, dayofweek, hour, minute, second, month, year, weekofyear
        // are functions from coreFunctions. When called without arguments, they use
        // context.pine.time as the default. This matches Pine Script behavior where
        // these can be used as both variables (dayofmonth) and functions (dayofmonth(time)).
        log: new Log(this),
        str: new Str(this),
        // Spread types first, then coreFunctions so functions can overwrite type enums
        ...types,
        ...coreFunctions
      };
      if (this.pine.dayofweek && typeof this.pine.dayofweek === "function") {
        this.pine.dayofweek.sunday = 1;
        this.pine.dayofweek.monday = 2;
        this.pine.dayofweek.tuesday = 3;
        this.pine.dayofweek.wednesday = 4;
        this.pine.dayofweek.thursday = 5;
        this.pine.dayofweek.friday = 6;
        this.pine.dayofweek.saturday = 7;
      }
      const plotHelper = new PlotHelper(this);
      const hlineHelper = new HlineHelper(this);
      const fillHelper = new FillHelper(this);
      this.bindContextObject(plotHelper, ["plotchar", "plotshape", "plotarrow", "plotbar", "plotcandle", "bgcolor", "barcolor"]);
      this.bindContextObject(
        plotHelper,
        [
          "any",
          "param",
          "linestyle_dashed",
          "linestyle_dotted",
          "linestyle_solid",
          "style_area",
          "style_areabr",
          "style_circles",
          "style_columns",
          "style_cross",
          "style_histogram",
          "style_line",
          "style_linebr",
          "style_stepline",
          "style_stepline_diamond",
          "style_steplinebr"
        ],
        "plot"
      );
      this.bindContextObject(hlineHelper, ["any", "style_dashed", "style_solid", "style_dotted", "param"], "hline");
      this.bindContextObject(fillHelper, ["any", "param"], "fill");
    }
    bindContextObject(instance, entries, root = "") {
      if (root && !this.pine[root]) this.pine[root] = {};
      const target = root ? this.pine[root] : this.pine;
      for (const entry of entries) {
        if (typeof instance[entry] === "function") {
          target[entry] = instance[entry].bind(instance);
        } else {
          target[entry] = instance[entry];
        }
      }
    }
    //#region [Runtime functions] ===========================
    /**
     * this function is used to initialize the target variable with the source array
     * this array will represent a time series and its values will be shifted at runtime in order to mimic Pine script behavior
     * @param trg - the target variable name : used internally to maintain the series in the execution context
     * @param src - the source data, can be Series, array, or a single value
     * @param idx - the index of the source array, used to get a sub-series of the source data
     * @returns Series object
     */
    init(trg, src, idx = 0) {
      let value;
      if (src instanceof Series) {
        value = src.get(0);
      } else if (Array.isArray(src)) {
        if (Array.isArray(src[0])) {
          value = src[0];
        } else {
          value = src[src.length - 1 + idx];
        }
      } else {
        value = src;
      }
      if (!trg) {
        return new Series([value]);
      }
      if (trg instanceof Series) {
        trg.data[trg.data.length - 1] = value;
        return trg;
      }
      if (Array.isArray(trg)) {
        trg[trg.length - 1] = value;
        return new Series(trg);
      }
      return new Series([value]);
    }
    /**
     * Initializes a 'var' variable.
     * - First bar: uses the initial value.
     * - Subsequent bars: maintains the previous value (state).
     * @param trg - The target variable
     * @param src - The source initializer value
     * @returns Series object
     */
    initVar(trg, src) {
      if (trg) {
        return trg;
      }
      let value;
      if (src instanceof Series) {
        value = src.get(0);
      } else if (Array.isArray(src)) {
        if (Array.isArray(src[0])) {
          value = src[0];
        } else {
          value = this.precision(src[src.length - 1]);
        }
      } else {
        value = this.precision(src);
      }
      return new Series([value]);
    }
    /**
     * this function is used to set the floating point precision of a number
     * by default it is set to 10 decimals which is the same as pine script
     * @param n - the number to be precision
     * @param decimals - the number of decimals to precision to
     * @returns the precision number
     */
    precision(value, decimals = 10) {
      const epsilon = 10 ** decimals;
      return typeof value === "number" ? Math.round(value * epsilon) / epsilon : value;
    }
    /**
     * This function is used to apply special transformation to internal PineTS parameters and handle them as time-series
     * @param source - the source data, can be an array or a single value
     * @param index - the index of the source array, used to get a sub-series of the source data
     * @param name - the name of the parameter, used as a unique identifier in the current execution context, this allows us to properly handle the param as a series
     * @returns the current value of the param
     */
    param(source, index, name) {
      if (typeof source === "string") return source;
      if (source instanceof Series) {
        if (index) {
          return new Series(source.data, source.offset + index);
        }
        return source;
      }
      if (!Array.isArray(source) && typeof source === "object") return source;
      if (!this.params[name]) this.params[name] = [];
      if (Array.isArray(source)) {
        return new Series(source, index || 0);
      } else {
        if (this.params[name].length === 0) {
          this.params[name].push(source);
        } else {
          this.params[name][this.params[name].length - 1] = source;
        }
        return new Series(this.params[name], 0);
      }
    }
    /**
     * Access a series value with Pine Script semantics (reverse order)
     * @param source - The source series or array
     * @param index - The lookback index (0 = current value)
     */
    get(source, index) {
      if (source instanceof Series) {
        return source.get(index);
      }
      if (Array.isArray(source)) {
        const realIndex = source.length - 1 - index;
        if (realIndex < 0 || realIndex >= source.length) {
          return NaN;
        }
        return source[realIndex];
      }
      return source;
    }
    /**
     * Set the current value of a series (index 0)
     * @param target - The target series or array
     * @param value - The value to set
     */
    set(target, value) {
      if (target instanceof Series) {
        target.set(0, value);
        return;
      }
      if (Array.isArray(target)) {
        if (target.length > 0) {
          target[target.length - 1] = value;
        } else {
          target.push(value);
        }
        return;
      }
    }
    /**
     * Pushes a call ID onto the stack
     * @param id - The call ID
     */
    pushId(id) {
      this._callStack.push(id);
    }
    /**
     * Pops a call ID from the stack
     */
    popId() {
      this._callStack.pop();
    }
    /**
     * Returns the current call ID from the top of the stack
     */
    peekId() {
      return this._callStack.length > 0 ? this._callStack[this._callStack.length - 1] : "";
    }
    /**
     * Calls a function with a specific call ID context
     * @param fn - The function to call
     * @param id - The call ID to use
     * @param args - Arguments to pass to the function
     */
    call(fn, id, ...args) {
      this.pushId(id);
      try {
        return fn(...args);
      } finally {
        this.popId();
      }
    }
    //#endregion
    //#region [Deprecated getters] ===========================
    /**
     * @deprecated Use context.pine.math instead. This will be removed in a future version.
     */
    get math() {
      this._showDeprecationWarning("const math = context.math", "const { math, ta, input } = context.pine");
      return this.pine.math;
    }
    /**
     * @deprecated Use context.pine.ta instead. This will be removed in a future version.
     */
    get ta() {
      this._showDeprecationWarning("const ta = context.ta", "const { ta, math, input } = context.pine");
      return this.pine.ta;
    }
    /**
     * @deprecated Use context.pine.input instead. This will be removed in a future version.
     */
    get input() {
      this._showDeprecationWarning("const input = context.input", "const { input, math, ta } = context.pine");
      return this.pine.input;
    }
    /**
     * @deprecated Use context.pine.request instead. This will be removed in a future version.
     */
    get request() {
      this._showDeprecationWarning("const request = context.request", "const { request, math, ta } = context.pine");
      return this.pine.request;
    }
    /**
     * @deprecated Use context.pine.array instead. This will be removed in a future version.
     */
    get array() {
      this._showDeprecationWarning("const array = context.array", "const { array, math, ta } = context.pine");
      return this.pine.array;
    }
    /**
     * @deprecated Use context.pine.* (e.g., context.pine.na, context.pine.plot) instead. This will be removed in a future version.
     */
    get core() {
      this._showDeprecationWarning("context.core.*", "context.pine (e.g., const { na, plotchar, color, plot, nz } = context.pine)");
      return {
        na: this.pine.na,
        fill: this.pine.fill,
        plotchar: this.pine.plotchar,
        plotshape: this.pine.plotshape,
        plotarrow: this.pine.plotarrow,
        color: this.pine.color,
        plot: this.pine.plot,
        nz: this.pine.nz
      };
    }
    /**
     * Shows a deprecation warning once per property access pattern
     */
    _showDeprecationWarning(oldUsage, newUsage) {
      const warningKey = `${oldUsage}->${newUsage}`;
      if (!_Context._deprecationWarningsShown.has(warningKey)) {
        _Context._deprecationWarningsShown.add(warningKey);
        if (typeof window !== "undefined") {
          console.warn(
            "%c[WARNING]%c %s syntax is deprecated. Use %s instead. This will be removed in a future version.",
            "color: #FFA500; font-weight: bold;",
            "color: #FFA500;",
            oldUsage,
            newUsage
          );
        } else {
          console.warn(
            `\x1B[33m[WARNING] ${oldUsage} syntax is deprecated. Use ${newUsage} instead. This will be removed in a future version.\x1B[0m`
          );
        }
      }
    }
    //#endregion
  };
  // Track deprecation warnings to avoid spam
  __publicField$3(_Context, "_deprecationWarningsShown", /* @__PURE__ */ new Set());
  let Context = _Context;

  var __defProp$2 = Object.defineProperty;
  var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$2 = (obj, key, value) => __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
  class Indicator {
    constructor(source, inputs = {}) {
      __publicField$2(this, "source");
      __publicField$2(this, "inputs");
      this.source = source;
      this.inputs = inputs;
    }
  }

  var __defProp$1 = Object.defineProperty;
  var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  class PineTS {
    constructor(source, tickerId, timeframe, limit, sDate, eDate) {
      this.source = source;
      this.tickerId = tickerId;
      this.timeframe = timeframe;
      this.limit = limit;
      this.sDate = sDate;
      this.eDate = eDate;
      __publicField$1(this, "data", []);
      //#region [Pine Script built-in variables]
      __publicField$1(this, "open", []);
      __publicField$1(this, "high", []);
      __publicField$1(this, "low", []);
      __publicField$1(this, "close", []);
      __publicField$1(this, "volume", []);
      __publicField$1(this, "hl2", []);
      __publicField$1(this, "hlc3", []);
      __publicField$1(this, "ohlc4", []);
      __publicField$1(this, "hlcc4", []);
      __publicField$1(this, "openTime", []);
      __publicField$1(this, "closeTime", []);
      //#endregion
      //#region run context
      // private _periods: number = undefined;
      // public get periods() {
      //     return this._periods;
      // }
      //#endregion
      //public fn: Function;
      __publicField$1(this, "_readyPromise", null);
      __publicField$1(this, "_ready", false);
      __publicField$1(this, "_debugSettings", {
        ln: false,
        debug: false
      });
      __publicField$1(this, "_transpiledCode", null);
      __publicField$1(this, "_isSecondaryContext", false);
      __publicField$1(this, "_syminfo");
      this._readyPromise = new Promise((resolve) => {
        this.loadMarketData(source, tickerId, timeframe, limit, sDate, eDate).then((data) => {
          const marketData = data;
          this.data = marketData;
          const _open = marketData.map((d) => d.open);
          const _close = marketData.map((d) => d.close);
          const _high = marketData.map((d) => d.high);
          const _low = marketData.map((d) => d.low);
          const _volume = marketData.map((d) => d.volume);
          const _hlc3 = marketData.map((d) => (d.high + d.low + d.close) / 3);
          const _hl2 = marketData.map((d) => (d.high + d.low) / 2);
          const _ohlc4 = marketData.map((d) => (d.high + d.low + d.open + d.close) / 4);
          const _hlcc4 = marketData.map((d) => (d.high + d.low + d.close + d.close) / 4);
          const _openTime = marketData.map((d) => d.openTime);
          const _closeTime = marketData.map((d) => d.closeTime);
          this.open = _open;
          this.close = _close;
          this.high = _high;
          this.low = _low;
          this.volume = _volume;
          this.hl2 = _hl2;
          this.hlc3 = _hlc3;
          this.ohlc4 = _ohlc4;
          this.hlcc4 = _hlcc4;
          this.openTime = _openTime;
          this.closeTime = _closeTime;
          if (source && source.getSymbolInfo) {
            source.getSymbolInfo(tickerId).then((symbolInfo2) => {
              this._syminfo = symbolInfo2;
              this._ready = true;
              resolve(true);
            }).catch((error) => {
              console.warn("Failed to get symbol info, using default values:", error);
              this._ready = true;
              resolve(true);
            });
          } else {
            this._ready = true;
            resolve(true);
          }
        });
      });
    }
    get transpiledCode() {
      return this._transpiledCode;
    }
    markAsSecondary() {
      this._isSecondaryContext = true;
    }
    setDebugSettings({ ln, debug }) {
      this._debugSettings.ln = ln;
      this._debugSettings.debug = debug;
    }
    async loadMarketData(source, tickerId, timeframe, limit, sDate, eDate) {
      if (Array.isArray(source)) {
        return source;
      } else {
        return source.getMarketData(tickerId, timeframe, limit, sDate, eDate);
      }
    }
    async ready() {
      if (this._ready) return true;
      if (!this._readyPromise) throw new Error("PineTS is not ready");
      return this._readyPromise;
    }
    /**
     * Run the Pine Script code and return the resulting context.
     * if pageSize is provided, the function will return an iterator that will yield the results page by page.
     * each page contains the results of "pageSize" periods.
     * @param pineTSCode
     * @param periods
     * @param pageSize
     * @returns Context if pageSize is 0 or undefined, or AsyncGenerator<Context> if pageSize > 0
     */
    run(pineTSCode, periods, pageSize) {
      let code;
      let inputs = {};
      if (pineTSCode instanceof Indicator) {
        code = pineTSCode.source;
        inputs = pineTSCode.inputs || {};
      } else {
        code = pineTSCode;
      }
      if (pageSize && pageSize > 0) {
        const enableLiveStream = typeof this.eDate === "undefined" && !Array.isArray(this.source);
        return this._runPaginated(code, inputs, periods, pageSize, enableLiveStream);
      } else {
        return this._runComplete(code, inputs, periods);
      }
    }
    /**
     * Stream the results of the Pine Script code.
     * Provides an event-based interface for handling streaming data.
     * @param pineTSCode The Pine Script code to execute
     * @param options Streaming options
     * @returns Object with on(event, callback) and stop() methods
     */
    stream(pineTSCode, options = {}) {
      const { live = true, interval = 1e3 } = options;
      const pageSize = options.pageSize || this.data.length;
      let code;
      let inputs = {};
      if (pineTSCode instanceof Indicator) {
        code = pineTSCode.source;
        inputs = pineTSCode.inputs || {};
      } else {
        code = pineTSCode;
      }
      const listeners = { data: [], error: [] };
      let stopped = false;
      const emit = (event, ...args) => {
        if (listeners[event]) {
          listeners[event].forEach((cb) => cb(...args));
        }
      };
      const on = (event, callback) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
      };
      const stop = () => {
        stopped = true;
      };
      (async () => {
        try {
          const isLiveCapable = typeof this.eDate === "undefined" && !Array.isArray(this.source);
          const enableLiveStream = isLiveCapable && live;
          const iterator = this._runPaginated(code, inputs, void 0, pageSize, enableLiveStream);
          for await (const ctx of iterator) {
            if (stopped) break;
            if (ctx === null) {
              await new Promise((resolve) => setTimeout(resolve, interval));
              continue;
            }
            emit("data", ctx);
            if (enableLiveStream && !stopped) {
              const currentCandle = ctx.marketData[ctx.idx];
              const isHistorical = currentCandle && currentCandle.closeTime < Date.now();
              if (!isHistorical) {
                await new Promise((resolve) => setTimeout(resolve, interval));
              }
            }
          }
        } catch (error) {
          emit("error", error);
        }
      })();
      return { on, stop };
    }
    /**
     * Run the script completely and return the final context (backward compatible behavior)
     * @private
     */
    async _runComplete(pineTSCode, inputs, periods) {
      await this.ready();
      if (!periods) periods = this.data.length;
      const context = this._initializeContext(pineTSCode, inputs, this._isSecondaryContext);
      this._transpiledCode = this._transpileCode(pineTSCode);
      await this._executeIterations(context, this._transpiledCode, this.data.length - periods, this.data.length);
      return context;
    }
    /**
     * Run the script with pagination, yielding results page by page
     * Each page contains only the new results for that page, not cumulative results
     * Uses a unified loop that handles both historical and live streaming data
     * @private
     */
    async *_runPaginated(pineTSCode, inputs, periods, pageSize, enableLiveStream = false) {
      await this.ready();
      if (!periods) periods = this.data.length;
      const context = this._initializeContext(pineTSCode, inputs, this._isSecondaryContext);
      this._transpiledCode = this._transpileCode(pineTSCode);
      const startIdx = this.data.length - periods;
      let processedUpToIdx = startIdx;
      while (true) {
        const availableData = this.data.length;
        const unprocessedCount = availableData - processedUpToIdx;
        if (unprocessedCount > 0) {
          const toProcess = Math.min(unprocessedCount, pageSize);
          const previousResultLength = this._getResultLength(context.result);
          await this._executeIterations(context, this._transpiledCode, processedUpToIdx, processedUpToIdx + toProcess);
          processedUpToIdx += toProcess;
          const pageContext = this._createPageContext(context, previousResultLength);
          yield pageContext;
          continue;
        }
        if (!enableLiveStream || Array.isArray(this.source)) {
          break;
        }
        const { newCandles, updatedLastCandle } = await this._updateMarketData();
        if (newCandles === 0 && !updatedLastCandle) {
          yield null;
          continue;
        }
        this._removeLastResult(context);
        processedUpToIdx = this.data.length - (newCandles + 1);
        context.pine.barstate.setLive();
      }
    }
    /**
     * Get the length of the result (works for arrays and objects)
     * @private
     */
    _getResultLength(result) {
      if (Array.isArray(result)) {
        return result.length;
      } else if (typeof result === "object" && result !== null) {
        const keys = Object.keys(result);
        if (keys.length > 0 && Array.isArray(result[keys[0]])) {
          return result[keys[0]].length;
        }
      }
      return 0;
    }
    /**
     * Create a context containing only the new results for the current page
     * @private
     */
    _createPageContext(fullContext, previousResultLength) {
      const pageContext = new Context({
        marketData: this.data,
        source: this.source,
        tickerId: this.tickerId,
        timeframe: this.timeframe,
        limit: this.limit,
        sDate: this.sDate,
        eDate: this.eDate,
        fullContext,
        inputs: fullContext.inputs
      });
      pageContext.pineTSCode = fullContext.pineTSCode;
      pageContext.idx = fullContext.idx;
      if (Array.isArray(fullContext.result)) {
        pageContext.result = fullContext.result.slice(previousResultLength);
      } else if (typeof fullContext.result === "object" && fullContext.result !== null) {
        pageContext.result = {};
        for (let key in fullContext.result) {
          if (Array.isArray(fullContext.result[key])) {
            pageContext.result[key] = fullContext.result[key].slice(previousResultLength);
          } else {
            pageContext.result[key] = fullContext.result[key];
          }
        }
      } else {
        pageContext.result = fullContext.result;
      }
      pageContext.plots = { ...fullContext.plots };
      return pageContext;
    }
    /**
     * Update market data from the last known candle to now (or eDate if provided)
     * Intelligently replaces the last candle if it's still open, or appends new candles
     * @param eDate - Optional end date, defaults to now
     * @returns Object containing: { newCandles: number, updatedLastCandle: boolean }
     * @private
     */
    async _updateMarketData(eDate) {
      if (Array.isArray(this.source)) {
        return { newCandles: 0, updatedLastCandle: false };
      }
      const provider = this.source;
      const lastCandleIdx = this.data.length - 1;
      const lastCandle = this.data[lastCandleIdx];
      const lastCandleOpenTime = lastCandle.openTime;
      try {
        const newData = await provider.getMarketData(this.tickerId, this.timeframe, void 0, lastCandleOpenTime, eDate);
        if (!newData || newData.length === 0) {
          return { newCandles: 0, updatedLastCandle: false };
        }
        let updatedLastCandle = false;
        let newCandles = 0;
        for (let i = 0; i < newData.length; i++) {
          const candle = newData[i];
          if (candle.openTime === lastCandleOpenTime) {
            this._replaceCandle(lastCandleIdx, candle);
            updatedLastCandle = true;
          } else if (candle.openTime > lastCandleOpenTime) {
            this._appendCandle(candle);
            newCandles++;
          }
        }
        return { newCandles, updatedLastCandle };
      } catch (error) {
        console.error("Error updating market data:", error);
        return { newCandles: 0, updatedLastCandle: false };
      }
    }
    /**
     * Replace a candle at a specific index with new data
     * @private
     */
    _replaceCandle(index, candle) {
      this.data[index] = candle;
      this.open[index] = candle.open;
      this.close[index] = candle.close;
      this.high[index] = candle.high;
      this.low[index] = candle.low;
      this.volume[index] = candle.volume;
      this.hl2[index] = (candle.high + candle.low) / 2;
      this.hlc3[index] = (candle.high + candle.low + candle.close) / 3;
      this.ohlc4[index] = (candle.high + candle.low + candle.open + candle.close) / 4;
      this.hlcc4[index] = (candle.high + candle.low + candle.close + candle.close) / 4;
      this.openTime[index] = candle.openTime;
      this.closeTime[index] = candle.closeTime;
    }
    /**
     * Append a new candle to the end of market data arrays
     * @private
     */
    _appendCandle(candle) {
      this.data.push(candle);
      this.open.push(candle.open);
      this.close.push(candle.close);
      this.high.push(candle.high);
      this.low.push(candle.low);
      this.volume.push(candle.volume);
      this.hl2.push((candle.high + candle.low) / 2);
      this.hlc3.push((candle.high + candle.low + candle.close) / 3);
      this.ohlc4.push((candle.high + candle.low + candle.open + candle.close) / 4);
      this.hlcc4.push((candle.high + candle.low + candle.close + candle.close) / 4);
      this.openTime.push(candle.openTime);
      this.closeTime.push(candle.closeTime);
    }
    /**
     * Remove the last result from context (for updating an open candle)
     * @private
     */
    _removeLastResult(context) {
      if (Array.isArray(context.result)) {
        context.result.pop();
      } else if (typeof context.result === "object" && context.result !== null) {
        for (let key in context.result) {
          if (Array.isArray(context.result[key])) {
            context.result[key].pop();
          }
        }
      }
      context.data.close.data.pop();
      context.data.open.data.pop();
      context.data.high.data.pop();
      context.data.low.data.pop();
      context.data.volume.data.pop();
      context.data.hl2.data.pop();
      context.data.hlc3.data.pop();
      context.data.ohlc4.data.pop();
      context.data.hlcc4.data.pop();
      context.data.openTime.data.pop();
      if (context.data.closeTime) {
        context.data.closeTime.data.pop();
      }
      const contextVarNames = ["const", "var", "let", "params"];
      for (let ctxVarName of contextVarNames) {
        for (let key in context[ctxVarName]) {
          const item = context[ctxVarName][key];
          if (item instanceof Series) {
            item.data.pop();
          } else if (Array.isArray(item)) {
            item.pop();
          }
        }
      }
    }
    /**
     * Initialize a new context for running Pine Script code
     * @private
     */
    _initializeContext(pineTSCode, inputs = {}, isSecondary = false) {
      const context = new Context({
        marketData: this.data,
        source: this.source,
        tickerId: this.tickerId,
        timeframe: this.timeframe,
        limit: this.limit,
        sDate: this.sDate,
        eDate: this.eDate,
        inputs
      });
      if (this._syminfo) {
        context.pine.syminfo.setSymbolInfo(this._syminfo);
      }
      context.pineTSCode = pineTSCode;
      context.isSecondaryContext = isSecondary;
      context.data.close = new Series([]);
      context.data.open = new Series([]);
      context.data.high = new Series([]);
      context.data.low = new Series([]);
      context.data.volume = new Series([]);
      context.data.hl2 = new Series([]);
      context.data.hlc3 = new Series([]);
      context.data.ohlc4 = new Series([]);
      context.data.hlcc4 = new Series([]);
      context.data.openTime = new Series([]);
      context.data.closeTime = new Series([]);
      return context;
    }
    /**
     * Transpile the Pine Script code
     * @private
     */
    _transpileCode(pineTSCode) {
      const transformer = transpile.bind(this);
      return transformer(pineTSCode, this._debugSettings);
    }
    /**
     * Execute iterations from startIdx to endIdx, updating the context
     * @private
     */
    async _executeIterations(context, transpiledFn, startIdx, endIdx) {
      const contextVarNames = ["const", "var", "let", "params"];
      for (let i = startIdx; i < endIdx; i++) {
        context.idx = i;
        context.data.close.data.push(this.close[i]);
        context.data.open.data.push(this.open[i]);
        context.data.high.data.push(this.high[i]);
        context.data.low.data.push(this.low[i]);
        context.data.volume.data.push(this.volume[i]);
        context.data.hl2.data.push(this.hl2[i]);
        context.data.hlc3.data.push(this.hlc3[i]);
        context.data.ohlc4.data.push(this.ohlc4[i]);
        context.data.hlcc4.data.push(this.hlcc4[i]);
        context.data.openTime.data.push(this.openTime[i]);
        context.data.closeTime.data.push(this.closeTime[i]);
        const result = await transpiledFn(context);
        if (typeof result === "object") {
          if (typeof context.result !== "object") {
            context.result = {};
          }
          for (let key in result) {
            if (context.result[key] === void 0) {
              context.result[key] = [];
            }
            let val;
            if (result[key] instanceof Series) {
              val = result[key].get(0);
            } else if (Array.isArray(result[key])) {
              val = result[key][result[key].length - 1];
            } else {
              val = result[key];
            }
            context.result[key].push(val);
          }
        } else {
          if (!Array.isArray(context.result)) {
            context.result = [];
          }
          context.result.push(result);
        }
        for (let ctxVarName of contextVarNames) {
          for (let key in context[ctxVarName]) {
            const item = context[ctxVarName][key];
            if (item instanceof Series) {
              const val = item.get(0);
              item.data.push(val);
            } else if (Array.isArray(item)) {
              const val = item[item.length - 1];
              item.push(val);
            }
          }
        }
      }
    }
  }

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  const BINANCE_API_URL_DEFAULT = "https://api.binance.com/api/v3";
  const BINANCE_API_URL_US = "https://api.binance.us/api/v3";
  const timeframe_to_binance = {
    "1": "1m",
    // 1 minute
    "3": "3m",
    // 3 minutes
    "5": "5m",
    // 5 minutes
    "15": "15m",
    // 15 minutes
    "30": "30m",
    // 30 minutes
    "45": null,
    // 45 minutes (not directly supported by Binance, needs custom handling)
    "60": "1h",
    // 1 hour
    "120": "2h",
    // 2 hours
    "180": null,
    // 3 hours (not directly supported by Binance, needs custom handling)
    "240": "4h",
    // 4 hours
    "4H": "4h",
    // 4 hours
    "1D": "1d",
    // 1 day
    D: "1d",
    // 1 day
    "1W": "1w",
    // 1 week
    W: "1w",
    // 1 week
    "1M": "1M",
    // 1 month
    M: "1M"
    // 1 month
  };
  class CacheManager {
    constructor(cacheDuration = 5 * 60 * 1e3) {
      __publicField(this, "cache");
      __publicField(this, "cacheDuration");
      this.cache = /* @__PURE__ */ new Map();
      this.cacheDuration = cacheDuration;
    }
    generateKey(params) {
      return Object.entries(params).filter(([_, value]) => value !== void 0).map(([key, value]) => `${key}:${value}`).join("|");
    }
    get(params) {
      const key = this.generateKey(params);
      const cached = this.cache.get(key);
      if (!cached) return null;
      if (Date.now() - cached.timestamp > this.cacheDuration) {
        this.cache.delete(key);
        return null;
      }
      return cached.data;
    }
    set(params, data) {
      const key = this.generateKey(params);
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
    clear() {
      this.cache.clear();
    }
    // Optional: method to remove expired entries
    cleanup() {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.cacheDuration) {
          this.cache.delete(key);
        }
      }
    }
  }
  class BinanceProvider {
    // Persist the working endpoint
    constructor() {
      __publicField(this, "cacheManager");
      __publicField(this, "activeApiUrl", null);
      this.cacheManager = new CacheManager(5 * 60 * 1e3);
    }
    /**
     * Resolves the working Binance API endpoint.
     * Tries default first, then falls back to US endpoint.
     * Caches the working endpoint for future calls.
     */
    async getBaseUrl() {
      if (this.activeApiUrl) {
        return this.activeApiUrl;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5e3);
        const response = await fetch(`${BINANCE_API_URL_DEFAULT}/ping`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          this.activeApiUrl = BINANCE_API_URL_DEFAULT;
          return this.activeApiUrl;
        }
      } catch (e) {
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5e3);
        const response = await fetch(`${BINANCE_API_URL_US}/ping`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          this.activeApiUrl = BINANCE_API_URL_US;
          return this.activeApiUrl;
        }
      } catch (e) {
      }
      return BINANCE_API_URL_DEFAULT;
    }
    async getMarketDataInterval(tickerId, timeframe, sDate, eDate) {
      try {
        const interval = timeframe_to_binance[timeframe.toUpperCase()];
        if (!interval) {
          console.error(`Unsupported timeframe: ${timeframe}`);
          return [];
        }
        const timeframeDurations = {
          "1m": 60 * 1e3,
          "3m": 3 * 60 * 1e3,
          "5m": 5 * 60 * 1e3,
          "15m": 15 * 60 * 1e3,
          "30m": 30 * 60 * 1e3,
          "1h": 60 * 60 * 1e3,
          "2h": 2 * 60 * 60 * 1e3,
          "4h": 4 * 60 * 60 * 1e3,
          "1d": 24 * 60 * 60 * 1e3,
          "1w": 7 * 24 * 60 * 60 * 1e3,
          "1M": 30 * 24 * 60 * 60 * 1e3
        };
        let allData = [];
        let currentStart = sDate;
        const endTime = eDate;
        const intervalDuration = timeframeDurations[interval];
        if (!intervalDuration) {
          console.error(`Duration not defined for interval: ${interval}`);
          return [];
        }
        while (currentStart < endTime) {
          const chunkEnd = Math.min(currentStart + 1e3 * intervalDuration, endTime);
          const data = await this.getMarketData(
            tickerId,
            timeframe,
            1e3,
            // Max allowed by Binance
            currentStart,
            chunkEnd
          );
          if (data.length === 0) break;
          allData = allData.concat(data);
          currentStart = data[data.length - 1].closeTime + 1;
        }
        return allData;
      } catch (error) {
        console.error("Error in getMarketDataInterval:", error);
        return [];
      }
    }
    async getMarketData(tickerId, timeframe, limit, sDate, eDate) {
      try {
        const shouldCache = eDate !== void 0;
        const cacheParams = { tickerId, timeframe, limit, sDate, eDate };
        if (shouldCache) {
          const cachedData = this.cacheManager.get(cacheParams);
          if (cachedData) {
            return cachedData;
          }
        }
        const interval = timeframe_to_binance[timeframe.toUpperCase()];
        if (!interval) {
          console.error(`Unsupported timeframe: ${timeframe}`);
          return [];
        }
        const needsPagination = this.shouldPaginate(timeframe, limit, sDate, eDate);
        if (needsPagination && sDate && eDate) {
          const allData = await this.getMarketDataInterval(tickerId, timeframe, sDate, eDate);
          const result2 = limit ? allData.slice(0, limit) : allData;
          this.cacheManager.set(cacheParams, result2);
          return result2;
        }
        const baseUrl = await this.getBaseUrl();
        let url = `${baseUrl}/klines?symbol=${tickerId}&interval=${interval}`;
        if (limit) {
          url += `&limit=${Math.min(limit, 1e3)}`;
        }
        if (sDate) {
          url += `&startTime=${sDate}`;
        }
        if (eDate) {
          url += `&endTime=${eDate}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const data = result.map((item) => {
          return {
            openTime: parseInt(item[0]),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]),
            closeTime: parseInt(item[6]),
            quoteAssetVolume: parseFloat(item[7]),
            numberOfTrades: parseInt(item[8]),
            takerBuyBaseAssetVolume: parseFloat(item[9]),
            takerBuyQuoteAssetVolume: parseFloat(item[10]),
            ignore: item[11]
          };
        });
        if (shouldCache) {
          this.cacheManager.set(cacheParams, data);
        }
        return data;
      } catch (error) {
        console.error("Error in binance.klines:", error);
        return [];
      }
    }
    /**
     * Determines if pagination is needed based on the parameters
     */
    shouldPaginate(timeframe, limit, sDate, eDate) {
      if (limit && limit > 1e3) {
        return true;
      }
      if (sDate && eDate) {
        const interval = timeframe_to_binance[timeframe.toUpperCase()];
        const timeframeDurations = {
          "1m": 60 * 1e3,
          "3m": 3 * 60 * 1e3,
          "5m": 5 * 60 * 1e3,
          "15m": 15 * 60 * 1e3,
          "30m": 30 * 60 * 1e3,
          "1h": 60 * 60 * 1e3,
          "2h": 2 * 60 * 60 * 1e3,
          "4h": 4 * 60 * 60 * 1e3,
          "1d": 24 * 60 * 60 * 1e3,
          "1w": 7 * 24 * 60 * 60 * 1e3,
          "1M": 30 * 24 * 60 * 60 * 1e3
        };
        const intervalDuration = timeframeDurations[interval];
        if (intervalDuration) {
          const requiredCandles = Math.ceil((eDate - sDate) / intervalDuration);
          return requiredCandles > 1e3;
        }
      }
      return false;
    }
    async getSymbolInfo(tickerId) {
      try {
        let marketType = "crypto";
        const baseUrl = await this.getBaseUrl();
        let apiUrl = baseUrl;
        let apiSymbol = tickerId;
        let contractType = "";
        if (tickerId.endsWith(".P")) {
          marketType = "futures";
          apiSymbol = tickerId.replace(".P", "");
          apiUrl = "https://fapi.binance.com/fapi/v1";
          contractType = "Perpetual";
        } else if (tickerId.includes("_")) {
          marketType = "futures";
          apiSymbol = tickerId;
          apiUrl = "https://dapi.binance.com/dapi/v1";
          contractType = "Delivery";
        }
        const url = marketType === "crypto" ? `${apiUrl}/exchangeInfo?symbol=${apiSymbol}` : `${apiUrl}/exchangeInfo`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        const symbols = result.symbols;
        if (!symbols || symbols.length === 0) {
          console.error(`Symbol ${tickerId} not found`);
          return null;
        }
        const symbolData = marketType === "futures" ? symbols.find((s) => s.symbol === apiSymbol) : symbols[0];
        if (!symbolData) {
          console.error(`Symbol ${apiSymbol} not found in exchange info`);
          return null;
        }
        const priceFilter = symbolData.filters?.find((f) => f.filterType === "PRICE_FILTER");
        const lotSizeFilter = symbolData.filters?.find((f) => f.filterType === "LOT_SIZE");
        const tickSize = priceFilter ? parseFloat(priceFilter.tickSize) : 0.01;
        const minQty = lotSizeFilter ? parseFloat(lotSizeFilter.minQty) : 0;
        const pricescale = Math.round(1 / tickSize);
        const baseAsset = symbolData.baseAsset;
        const quoteAsset = symbolData.quoteAsset;
        const typeLabel = contractType ? ` ${contractType}` : "";
        const description = `${baseAsset} / ${quoteAsset}${typeLabel}`;
        const symbolInfo = {
          // Symbol Identification
          ticker: tickerId,
          // KEEP ORIGINAL including .P if present!
          tickerid: `BINANCE:${tickerId}`,
          // Also keep .P here
          prefix: "BINANCE",
          root: baseAsset,
          // Just the base asset: "BTC"
          description,
          type: marketType,
          main_tickerid: `BINANCE:${tickerId}`,
          current_contract: contractType,
          isin: "",
          // Currency & Location
          basecurrency: baseAsset,
          currency: quoteAsset,
          timezone: "Etc/UTC",
          country: "",
          // Price & Contract Info
          mintick: tickSize,
          pricescale,
          minmove: 1,
          pointvalue: symbolData.contractSize || 1,
          mincontract: minQty,
          // Session & Market
          session: "24x7",
          volumetype: "base",
          expiration_date: symbolData.deliveryDate || 0,
          // Company Data (N/A for crypto)
          employees: 0,
          industry: "",
          sector: "",
          shareholders: 0,
          shares_outstanding_float: 0,
          shares_outstanding_total: 0,
          // Analyst Ratings (N/A for crypto)
          recommendations_buy: 0,
          recommendations_buy_strong: 0,
          recommendations_date: 0,
          recommendations_hold: 0,
          recommendations_sell: 0,
          recommendations_sell_strong: 0,
          recommendations_total: 0,
          // Price Targets (N/A for crypto)
          target_price_average: 0,
          target_price_date: 0,
          target_price_estimates: 0,
          target_price_high: 0,
          target_price_low: 0,
          target_price_median: 0
        };
        return symbolInfo;
      } catch (error) {
        console.error("Error in binance.exchangeInfo:", error);
        return null;
      }
    }
  }

  class MockProvider {
                          async getMarketData() {
                              return [];
                          }
                      }

  const isNodeEnvironment = typeof process !== "undefined" && process.versions && process.versions.node;
  let MockProviderInstance = null;
  if (isNodeEnvironment) {
    try {
      MockProviderInstance = new MockProvider();
    } catch (e) {
      MockProviderInstance = null;
    }
  }
  const Provider = {
    Binance: new BinanceProvider(),
    // Only include Mock provider in Node.js environments (excluded from browser builds)
    ...MockProviderInstance ? { Mock: MockProviderInstance } : {}
    //TODO : add other providers (polygon, etc.)
  };

  exports.Context = Context;
  exports.Indicator = Indicator;
  exports.PineTS = PineTS;
  exports.Provider = Provider;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
;var PineTS = PineTSLib.PineTS;PineTS.Provider = PineTSLib.Provider;PineTS.Context = PineTSLib.Context;