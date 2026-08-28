package com.quickcart.config;

import com.quickcart.model.Product;
import com.quickcart.model.Role;
import com.quickcart.model.Store;
import com.quickcart.model.User;
import com.quickcart.model.Vertical;
import com.quickcart.repository.ProductRepository;
import com.quickcart.repository.StoreRepository;
import com.quickcart.repository.UserRepository;
import com.quickcart.util.GeoUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds a large catalog of demo stores/products across every vertical, using
 * real photos pulled from Unsplash (images.unsplash.com hotlinks - no API
 * key needed, verified working) so the app looks real from first launch.
 *
 * Each product carries its own image pool and its own menu category/section
 * (e.g. "Pizzas", "Appetizers", "Drinks") so a store page reads like a real
 * menu grouped into sections rather than one flat product grid.
 *
 * A per-pool cursor hands out a fresh photo from the pool every time it's
 * called, so two stores/products sharing a pool never repeat the same
 * picture until the whole pool is exhausted.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    // Demo city center (San Francisco) - all seeded stores sit near here so
    // they cluster nicely on the map. GeoUtil re-centers this same cluster
    // onto a real ZIP code / GPS location the viewer picks.
    private static final double CENTER_LAT = GeoUtil.DEMO_CENTER_LAT;
    private static final double CENTER_LNG = GeoUtil.DEMO_CENTER_LNG;

    private record ProductSeed(String name, String description, String price, String category, String pool) {
    }

    private record StoreSeed(String name, Vertical vertical, String pool, double rating, int etaMinutes,
                              double latOffset, double lngOffset, List<ProductSeed> products) {
    }

    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Map<String, Integer> cursor = new HashMap<>();

    // Demo-only defaults - override with the ADMIN_EMAIL / ADMIN_PASSWORD env
    // vars before deploying anywhere real, since these are visible in source.
    @Value("${admin.seed.email:admin@quickcart.com}")
    private String adminEmail;

    @Value("${admin.seed.password:Admin123!Quick}")
    private String adminPassword;

    public DataSeeder(StoreRepository storeRepository, ProductRepository productRepository,
                       UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.storeRepository = storeRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedAdmin();

        if (storeRepository.count() > 0) {
            return;
        }

        int productIndex = 0;
        for (StoreSeed seed : SEED_STORES) {
            Store store = new Store();
            store.setName(seed.name());
            store.setVertical(seed.vertical());
            store.setImageUrl(nextImage(seed.pool()));
            store.setRating(seed.rating());
            store.setEtaMinutes(seed.etaMinutes());
            store.setLat(CENTER_LAT + seed.latOffset());
            store.setLng(CENTER_LNG + seed.lngOffset());
            storeRepository.save(store);

            for (ProductSeed p : seed.products()) {
                Product product = new Product();
                product.setStore(store);
                product.setName(p.name());
                product.setDescription(p.description());
                product.setCategory(p.category());
                product.setPrice(new BigDecimal(p.price()));
                product.setImageUrl(nextImage(p.pool()));
                product.setStock(100);
                applyBadge(product, productIndex++);
                productRepository.save(product);
            }
        }
    }

    // Deterministic badge rotation across the whole catalog - most products get
    // no badge at all, a few cycle through the rest so it reads as varied but
    // reproducible on every fresh seed.
    private static final String[] BADGE_CYCLE = {
            null, null, "BESTSELLER", null, null, "TRENDING", null, "NEW", "SALE"
    };

    private void applyBadge(Product product, int index) {
        String badge = BADGE_CYCLE[index % BADGE_CYCLE.length];
        if (badge == null) {
            return;
        }
        product.setBadge(badge);
        if ("SALE".equals(badge)) {
            product.setOriginalPrice(product.getPrice().multiply(new BigDecimal("1.25")).setScale(2, java.math.RoundingMode.HALF_UP));
        }
    }

    private void seedAdmin() {
        if (userRepository.existsByEmail(adminEmail)) {
            return;
        }

        User admin = new User("QuickCart Admin", adminEmail, passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
    }

    private String nextImage(String pool) {
        List<String> ids = IMAGE_POOLS.get(pool);
        int idx = cursor.merge(pool, 1, Integer::sum) - 1;
        return "https://images.unsplash.com/" + ids.get(idx % ids.size()) + "?auto=format&fit=crop&w=480&q=80";
    }

    private static final Map<String, List<String>> IMAGE_POOLS = Map.ofEntries(
            Map.entry("PIZZA", List.of(
                    "photo-1513104890138-7c749659a591", "photo-1565299624946-b28f40a0ae38",
                    "photo-1604382354936-07c5d9983bd3", "photo-1593504049359-74330189a345",
                    "photo-1534308983496-4fabb1a015ee", "photo-1613564834361-9436948817d1",
                    "photo-1574071318508-1cdbab80d002", "photo-1579751626657-72bc17010498",
                    "photo-1593560708920-61dd98c46a4e", "photo-1594007654729-407eedc4be65"
            )),
            Map.entry("BURGER", List.of(
                    "photo-1568901346375-23c9450c58cd", "photo-1586190848861-99aa4a171e90",
                    "photo-1572802419224-296b0aeee0d9", "photo-1550547660-d9450f859349",
                    "photo-1610440042657-612c34d95e9f", "photo-1571091718767-18b5b1457add",
                    "photo-1603064752734-4c48eff53d05", "photo-1607013251379-e6eecfffe234",
                    "photo-1549611016-3a70d82b5040", "photo-1551782450-a2132b4ba21d"
            )),
            Map.entry("SUSHI", List.of(
                    "photo-1579584425555-c3ce17fd4351", "photo-1615361200141-f45040f367be",
                    "photo-1579871494447-9811cf80d66c", "photo-1553621042-f6e147245754",
                    "photo-1611143669185-af224c5e3252", "photo-1617196034183-421b4917c92d",
                    "photo-1563612116625-3012372fccce", "photo-1502364271109-0a9a75a2a9df",
                    "photo-1582450871972-ab5ca641643d", "photo-1512132411229-c30391241dd8"
            )),
            Map.entry("RAMEN", List.of(
                    "photo-1612927601601-6638404737ce", "photo-1684707878393-02606f779d7f",
                    "photo-1591814468924-caf88d1232e1", "photo-1602881917760-7379db593981",
                    "photo-1628610688436-e635552020fc", "photo-1631709497146-a239ef373cf1",
                    "photo-1597394412452-60ed971d3917", "photo-1609672655400-c509bdbcf7e2",
                    "photo-1638866281450-3933540af86a", "photo-1496114212242-bac8bd9de53d",
                    "photo-1588001291548-948f55922bfd", "photo-1664337873053-840ea51d271d"
            )),
            Map.entry("INDIAN", List.of(
                    "photo-1585937421612-70a008356fbe", "photo-1565557623262-b51c2513a641",
                    "photo-1631452180539-96aca7d48617", "photo-1603894584373-5ac82b2ae398",
                    "photo-1596797038530-2c107229654b", "photo-1606471191009-63994c53433b",
                    "photo-1542367592-8849eb950fd8", "photo-1627366422957-3efa9c6df0fc",
                    "photo-1567337710282-00832b415979", "photo-1536305030588-45dc07a2a372"
            )),
            Map.entry("BIRYANI", List.of(
                    "photo-1589302168068-964664d93dc0", "photo-1631515243349-e0cb75fb8d3a",
                    "photo-1697155406055-2db32d47ca07", "photo-1705174299330-939dd03cc864",
                    "photo-1563379091339-03b21ab4a4f8", "photo-1716550781939-beb7d7247aae",
                    "photo-1633945274405-b6c8069047b0", "photo-1633945274309-2c16c9682a8c",
                    "photo-1719239885399-f87d992e0f18", "photo-1630851840633-f96999247032",
                    "photo-1599043513900-ed6fe01d3833", "photo-1666190092689-e3968aa0c32c",
                    "photo-1691171047462-66025ecd5efc", "photo-1642821373181-696a54913e93",
                    "photo-1708184528306-f75a0a5118ee"
            )),
            Map.entry("MEXICAN", List.of(
                    "photo-1599974579688-8dbdd335c77f", "photo-1565299585323-38d6b0865b47",
                    "photo-1551504734-5ee1c4a1479b", "photo-1629793980446-192d630f0dbe",
                    "photo-1552332386-f8dd00dc2f85", "photo-1683062332605-4e1209d75346",
                    "photo-1564767655658-4e6b365884ff", "photo-1599488400918-5f5f96b3f463",
                    "photo-1582234372722-50d7ccc30ebd", "photo-1519861155730-0b5fbf0dd889"
            )),
            Map.entry("CHINESE", List.of(
                    "photo-1585032226651-759b368d7246", "photo-1569718212165-3a8278d5f624",
                    "photo-1623689048105-a17b1e1936b8", "photo-1635685296916-95acaf58471f",
                    "photo-1555126634-323283e090fa", "photo-1707013533606-62919aa3aa29",
                    "photo-1526318896980-cf78c088247c", "photo-1530569112985-108dc2578ec2",
                    "photo-1623689046286-01d812cc8bad", "photo-1614104030967-5ca61a54247b",
                    "photo-1563245372-f21724e3856d", "photo-1517499414974-3b42addf2d86",
                    "photo-1603133872878-684f208fb84b", "photo-1607328874071-45a9cd600644",
                    "photo-1540100716001-4b432820e37f", "photo-1664717698774-84f62382613b",
                    "photo-1751618646882-4221d5e3b1c2", "photo-1600326145359-3a44909d1a39",
                    "photo-1634864572865-1cf8ff8bd23d", "photo-1716535232835-6d56282dfe8a",
                    "photo-1592778024292-d6782d22add7", "photo-1626804475297-41608ea09aeb",
                    "photo-1585410304004-56ae05651552", "photo-1602811379863-3687f23b8dcc",
                    "photo-1570898995876-3c8350edada1", "photo-1680675494363-75bbf9838a09"
            )),
            Map.entry("BREAKFAST", List.of(
                    "photo-1655979283362-535e6a167a53", "photo-1529940122574-0096689bc5cf",
                    "photo-1619602715098-1ea02d665224", "photo-1670710029405-ad968b51b6dc",
                    "photo-1626920370508-cf4d8f916448", "photo-1618666185561-baed3459ff18",
                    "photo-1560055932-595dab110124", "photo-1564216550945-b9aca66d0a10",
                    "photo-1620280614936-fbd4339f9446", "photo-1583527825770-8bd0bfb1f1c1"
            )),
            Map.entry("DESSERT", List.of(
                    "photo-1588195538326-c5b1e9f80a1b", "photo-1568827999250-3f6afff96e66",
                    "photo-1605807646983-377bc5a76493", "photo-1516054575922-f0b8eeadec1a",
                    "photo-1530648672449-81f6c723e2f1", "photo-1660383534593-6b5221ab80d2",
                    "photo-1576618148423-df549bcb6972", "photo-1624000961428-eeece184988b",
                    "photo-1555050338-0abc773f7978", "photo-1615735486329-c61cd40bfcc6"
            )),
            Map.entry("DRINKS", List.of(
                    "photo-1551024709-8f23befc6f87", "photo-1640766322140-ab90a7bc71e5",
                    "photo-1625865019845-7b2c89b8a8a9", "photo-1596463989140-3b600dab72e5",
                    "photo-1574571791847-06514225b338", "photo-1532517287333-fbb66d7e6006",
                    "photo-1473425990767-8324e48b48b5", "photo-1541745038731-f1c2b5a1a49e",
                    "photo-1517959105821-eaf2591984ca", "photo-1598679253587-829c6cc6c6fc",
                    "photo-1556679343-c7306c1976bc", "photo-1533007716222-4b465613a984",
                    "photo-1581636625402-29b2a704ef13", "photo-1544241907-f3f1f5ded15a",
                    "photo-1601390395693-364c0e22031a", "photo-1654923064639-834d2bf32716",
                    "photo-1499961024600-ad094db305cc", "photo-1470752354724-60a1d2b1907f",
                    "photo-1700328971815-854758899c06", "photo-1625126590447-cb769384e1f0",
                    "photo-1484542959923-de288ec85ce1", "photo-1713949215254-9769b4ad8724",
                    "photo-1589126065327-75b44f303631"
            )),
            Map.entry("VEGETABLES", List.of(
                    "photo-1579113800032-c38bd7635818", "photo-1597362925123-77861d3fbac7",
                    "photo-1590779033100-9f60a05a013d", "photo-1610348725531-843dff563e2c",
                    "photo-1566385101042-1a0aa0c1268c", "photo-1542838132-92c53300491e",
                    "photo-1557844352-761f2565b576", "photo-1540420773420-3366772f4999",
                    "photo-1518843875459-f738682238a6", "photo-1592924802543-809bfeee53fb",
                    "photo-1471193945509-9ad0617afabf", "photo-1624668430039-0175a0fbf006"
            )),
            Map.entry("FRUIT", List.of(
                    "photo-1610832958506-aa56368176cf", "photo-1619566636858-adf3ef46400b",
                    "photo-1526318472351-c75fcf070305", "photo-1631209121750-a9f656d28f46",
                    "photo-1628689469838-524a4a973b8e", "photo-1609780447631-05b93e5a88ea",
                    "photo-1580052614034-c55d20bfee3b", "photo-1560761098-21f5722ecb14",
                    "photo-1487376480913-24046456a727", "photo-1586099529369-00432c0492cd"
            )),
            Map.entry("BAKERY", List.of(
                    "photo-1608198093002-ad4e005484ec", "photo-1568254183919-78a4f43a2877",
                    "photo-1509440159596-0249088772ff", "photo-1587241321921-91a834d6d191",
                    "photo-1523294587484-bae6cc870010", "photo-1559811814-e2c57b5e69df",
                    "photo-1549413468-cd78edb7e75c", "photo-1567042661848-7161ce446f85",
                    "photo-1622808516114-02a5749cd965", "photo-1546237769-6f84ec1a512a"
            )),
            Map.entry("GROCERY_GENERAL", List.of(
                    "photo-1604719312566-8912e9227c6a", "photo-1628102491629-778571d893a3",
                    "photo-1553531889-56cc480ac5cb", "photo-1601598851547-4302969d0614",
                    "photo-1670684684445-a4504dca0bbc", "photo-1578916171728-46686eac8d58",
                    "photo-1583258292688-d0213dc5a3a8", "photo-1601600576337-c1d8a0d1373c",
                    "photo-1515706886582-54c73c5eaf41", "photo-1521566652839-697aa473761a"
            )),
            Map.entry("PHARMACY", List.of(
                    "photo-1607619056574-7b8d3ee536b2", "photo-1628771065518-0d82f1938462",
                    "photo-1576602976047-174e57a47881", "photo-1587854692152-cbe660dbde88",
                    "photo-1642055514517-7b52288890ec", "photo-1580281657527-47f249e8f4df",
                    "photo-1576091358783-a212ec293ff3", "photo-1603706580932-6befcf7d8521",
                    "photo-1585435557343-3b092031a831", "photo-1617881770125-6fb0d039ecde",
                    "photo-1580281658223-9b93f18ae9ae", "photo-1676364423874-19c785db3e61"
            )),
            Map.entry("VITAMINS", List.of(
                    "photo-1707129785947-ddc627a8bab9", "photo-1664956618021-73c47736845e",
                    "photo-1624362772755-4d5843e67047", "photo-1565071783280-719b01b29912",
                    "photo-1559087316-6b27308e53f6", "photo-1592323818181-f9b967ff537c",
                    "photo-1528272252360-5efd274e36fb", "photo-1583088580009-2d947c3e90a6",
                    "photo-1670850757896-e1b6c3e311ea", "photo-1648139346494-2b961c5a2bb7",
                    "photo-1732900490015-a5167a642998", "photo-1664786908163-85ca46f85138"
            )),
            Map.entry("ELECTRONICS", List.of(
                    "photo-1555664424-778a1e5e1b48", "photo-1515940175183-6798529cb860",
                    "photo-1588508065123-287b28e013da", "photo-1620783770629-122b7f187703",
                    "photo-1526738549149-8e07eca6c147", "photo-1602526432604-029a709e131c",
                    "photo-1526406915894-7bcd65f60845", "photo-1593687395549-400945fed803",
                    "photo-1618166080964-cdb5843979b0", "photo-1519335553051-96f1218cd5fa",
                    "photo-1639915008614-7b6797823861", "photo-1717295248521-4c1f2b6bcd6e"
            )),
            Map.entry("HEADPHONES", List.of(
                    "photo-1505740420928-5e560c06d30e", "photo-1618366712010-f4ae9c647dcb",
                    "photo-1545127398-14699f92334b", "photo-1546435770-a3e426bf472b",
                    "photo-1613040809024-b4ef7ba99bc3", "photo-1590658268037-6bf12165a8df",
                    "photo-1641048930621-ab5d225ae5b0", "photo-1609081219090-a6d81d3085bf",
                    "photo-1585298723682-7115561c51b7", "photo-1491927570842-0261e477d937",
                    "photo-1606741965326-cb990ae01bb2", "photo-1487215078519-e21cc028cb29"
            )),
            Map.entry("FASHION", List.of(
                    "photo-1515886657613-9f3515b0c78f", "photo-1558769132-cb1aea458c5e",
                    "photo-1483985988355-763728e1935b", "photo-1529139574466-a303027c1d8b",
                    "photo-1557777586-f6682739fcf3", "photo-1532453288672-3a27e9be9efd",
                    "photo-1601762603339-fd61e28b698a", "photo-1441984904996-e0b6ba687e04",
                    "photo-1574015974293-817f0ebebb74", "photo-1571513800374-df1bbe650e56",
                    "photo-1574201635302-388dd92a4c3f", "photo-1591047139829-d91aecb6caea",
                    "photo-1625698311031-f0dd15be5144", "photo-1666861585341-5bd1e7b1ed71",
                    "photo-1582719188393-bb71ca45dbb9", "photo-1732257119942-a19648e482f2",
                    "photo-1614990354198-b06764dcb13c", "photo-1662710072139-a4695caae692",
                    "photo-1603400521630-9f2de124b33b", "photo-1636267289101-80f5d51954fc",
                    "photo-1604882767135-b41fac508fff", "photo-1705675451868-014a161e591b",
                    "photo-1729487151777-b4be9098ecbb"
            )),
            Map.entry("SNEAKERS", List.of(
                    "photo-1560769629-975ec94e6a86", "photo-1656944227421-416b1d2186c9",
                    "photo-1605523741177-cd660595c2cf", "photo-1656164753657-8ff832063a71",
                    "photo-1628413993904-94ecb60f1239", "photo-1695073621086-aa692bc32a3d",
                    "photo-1604671801908-6f0c6a092c05", "photo-1618677831708-0e7fda3148b4",
                    "photo-1656164603279-b989e21168ba", "photo-1542219550-37153d387c27"
            )),
            Map.entry("COSMETICS", List.of(
                    "photo-1596462502278-27bfdc403348", "photo-1512496015851-a90fb38ba796",
                    "photo-1522335789203-aabd1fc54bc9", "photo-1516975080664-ed2fc6a32937",
                    "photo-1596704017254-9b121068fb31", "photo-1515688594390-b649af70d282",
                    "photo-1608979048467-6194dabc6a3d", "photo-1511923199659-1c16881689de",
                    "photo-1583784561105-a674080f391e", "photo-1704621354138-e124277356f2",
                    "photo-1600634999623-864991678406", "photo-1487412947147-5cebf100ffc2"
            )),
            Map.entry("SKINCARE", List.of(
                    "photo-1570172619644-dfd03ed5d881", "photo-1631730486572-226d1f595b68",
                    "photo-1728727267814-792db55ce678", "photo-1582616698198-f978da534162",
                    "photo-1647004692483-c5d942fe1137", "photo-1583209814683-c023dd293cc6",
                    "photo-1599847872487-55351feaf63d", "photo-1653784097013-786a8965ea3b",
                    "photo-1575330933415-cea1e7ce53eb", "photo-1588406641472-635d727857e0"
            )),
            Map.entry("PETS", List.of(
                    "photo-1623387641168-d9803ddd3f35", "photo-1450778869180-41d0601e046e",
                    "photo-1563460716037-460a3ad24ba9", "photo-1509205477838-a534e43a849f",
                    "photo-1573435567032-ff5982925350", "photo-1602979677071-1781b7f40023",
                    "photo-1599194921977-f89d8bd0eefb", "photo-1606098216818-40939b7c98ad",
                    "photo-1546377791-2e01b4449bf0", "photo-1517105274840-437212774105",
                    "photo-1662261728536-910777a82ce4", "photo-1642625932641-3a52ad27e268"
            )),
            Map.entry("HOME", List.of(
                    "photo-1616046229478-9901c5536a45", "photo-1583847268964-b28dc8f51f92",
                    "photo-1615873968403-89e068629265", "photo-1616486338812-3dadae4b4ace",
                    "photo-1572048572872-2394404cf1f3", "photo-1618221195710-dd6b41faaea6",
                    "photo-1615874694520-474822394e73", "photo-1554995207-c18c203602cb",
                    "photo-1582131503261-fca1d1c0589f", "photo-1616047006789-b7af5afb8c20",
                    "photo-1617103996702-96ff29b1c467", "photo-1534349762230-e0cadf78f5da"
            )),
            Map.entry("STATIONERY", List.of(
                    "photo-1510070009289-b5bc34383727", "photo-1485819665514-881a8f294f7a",
                    "photo-1707413463619-8f4926d225ba", "photo-1542617270-267b0f5a56da",
                    "photo-1530041859951-6cbea5e69b14", "photo-1518553634183-40a6deeae021",
                    "photo-1523634450041-0d0fbceb4036", "photo-1558632919-77834c897d36",
                    "photo-1675472574322-50633f897b2f", "photo-1540921304892-aae50a14c9a5"
            ))
    );

    private static final List<StoreSeed> SEED_STORES = List.of(

            // ---------- FOOD ----------
            new StoreSeed("Tony's Pizzeria", Vertical.FOOD, "PIZZA", 4.6, 25, 0.010, 0.000, List.of(
                    new ProductSeed("Margherita Pizza", "Classic tomato, mozzarella & basil", "12.99", "Pizzas", "PIZZA"),
                    new ProductSeed("Pepperoni Pizza", "Loaded with pepperoni", "14.49", "Pizzas", "PIZZA"),
                    new ProductSeed("Four Cheese Pizza", "Mozzarella, gorgonzola, parmesan, fontina", "15.49", "Pizzas", "PIZZA"),
                    new ProductSeed("Veggie Supreme Pizza", "Peppers, onion, mushroom, olives", "14.99", "Pizzas", "PIZZA"),
                    new ProductSeed("BBQ Chicken Pizza", "Grilled chicken, BBQ sauce, red onion", "15.99", "Pizzas", "PIZZA"),
                    new ProductSeed("Build Your Own Pizza", "Pick your crust, sauce & toppings", "13.99", "Build Your Own", "PIZZA"),
                    new ProductSeed("Garlic Bread", "Toasted with garlic butter", "5.99", "Appetizers", "BAKERY"),
                    new ProductSeed("Mozzarella Sticks", "Crispy fried, marinara dip", "7.49", "Appetizers", "DESSERT"),
                    new ProductSeed("Bruschetta", "Toasted bread, tomato, basil", "6.99", "Appetizers", "VEGETABLES"),
                    new ProductSeed("Caesar Salad", "Crisp romaine, parmesan, croutons", "7.49", "Salads", "VEGETABLES"),
                    new ProductSeed("Greek Salad", "Feta, olives, cucumber, tomato", "8.49", "Salads", "VEGETABLES"),
                    new ProductSeed("Tiramisu", "Classic Italian dessert", "6.99", "Desserts", "DESSERT"),
                    new ProductSeed("Cannoli", "Sicilian pastry, sweet ricotta filling", "5.99", "Desserts", "DESSERT"),
                    new ProductSeed("Italian Soda", "Sparkling fruit soda", "3.49", "Drinks", "DRINKS"),
                    new ProductSeed("Sparkling Water", "Chilled, lightly carbonated", "2.99", "Drinks", "DRINKS")
            )),
            new StoreSeed("Smokehouse Burgers", Vertical.FOOD, "BURGER", 4.4, 20, -0.008, 0.012, List.of(
                    new ProductSeed("Classic Cheeseburger", "Beef patty, cheddar, lettuce, tomato", "9.99", "Burgers", "BURGER"),
                    new ProductSeed("Bacon Burger", "Double patty with crispy bacon", "11.49", "Burgers", "BURGER"),
                    new ProductSeed("Veggie Burger", "Plant-based patty with fixings", "10.49", "Burgers", "BURGER"),
                    new ProductSeed("Double Smash Burger", "Two smashed patties, American cheese", "12.99", "Burgers", "BURGER"),
                    new ProductSeed("BBQ Burger", "Crispy onions, smoky BBQ sauce", "11.99", "Burgers", "BURGER"),
                    new ProductSeed("Crispy Fries", "Golden crinkle-cut fries", "3.99", "Sides", "BURGER"),
                    new ProductSeed("Onion Rings", "Beer-battered onion rings", "4.49", "Sides", "BURGER"),
                    new ProductSeed("Sweet Potato Fries", "Crispy, lightly salted", "4.49", "Sides", "BURGER"),
                    new ProductSeed("Chocolate Milkshake", "Thick and creamy", "5.49", "Shakes", "DRINKS"),
                    new ProductSeed("Vanilla Milkshake", "Classic vanilla bean", "5.49", "Shakes", "DRINKS"),
                    new ProductSeed("Strawberry Milkshake", "Made with real strawberries", "5.49", "Shakes", "DRINKS")
            )),
            new StoreSeed("Sakura Sushi", Vertical.FOOD, "SUSHI", 4.8, 30, 0.015, -0.010, List.of(
                    new ProductSeed("California Roll", "Crab, avocado, cucumber", "8.99", "Sushi Rolls", "SUSHI"),
                    new ProductSeed("Dragon Roll", "Eel, avocado, tempura crunch", "14.99", "Sushi Rolls", "SUSHI"),
                    new ProductSeed("Spicy Tuna Roll", "Tuna, spicy mayo, scallion", "10.99", "Sushi Rolls", "SUSHI"),
                    new ProductSeed("Rainbow Roll", "Assorted fish over California roll", "15.99", "Sushi Rolls", "SUSHI"),
                    new ProductSeed("Salmon Nigiri Set", "6 pieces fresh salmon nigiri", "13.99", "Nigiri & Sashimi", "SUSHI"),
                    new ProductSeed("Tuna Sashimi Plate", "8 pieces fresh tuna sashimi", "16.99", "Nigiri & Sashimi", "SUSHI"),
                    new ProductSeed("Tonkotsu Ramen", "Rich pork broth, chashu, egg", "13.49", "Ramen", "RAMEN"),
                    new ProductSeed("Miso Ramen", "Savory miso broth, corn, scallion", "12.99", "Ramen", "RAMEN"),
                    new ProductSeed("Spicy Chicken Ramen", "Spicy broth, grilled chicken", "13.49", "Ramen", "RAMEN"),
                    new ProductSeed("Edamame", "Steamed and salted soybeans", "4.99", "Appetizers", "SUSHI"),
                    new ProductSeed("Pork Gyoza", "Pan-fried dumplings, 6 pieces", "6.99", "Appetizers", "SUSHI"),
                    new ProductSeed("Miso Soup", "Traditional soybean broth", "3.49", "Appetizers", "SUSHI"),
                    new ProductSeed("Iced Green Tea", "Unsweetened, refreshing", "2.99", "Drinks", "DRINKS"),
                    new ProductSeed("Ramune Soda", "Japanese marble soda", "3.49", "Drinks", "DRINKS")
            )),
            new StoreSeed("Curry Palace", Vertical.FOOD, "INDIAN", 4.5, 35, -0.014, -0.006, List.of(
                    new ProductSeed("Butter Chicken", "Creamy tomato curry with chicken", "13.99", "Curries", "INDIAN"),
                    new ProductSeed("Paneer Tikka Masala", "Grilled paneer in spiced gravy", "12.49", "Curries", "INDIAN"),
                    new ProductSeed("Chicken Vindaloo", "Fiery tangy curry, Goan style", "13.49", "Curries", "INDIAN"),
                    new ProductSeed("Palak Paneer", "Paneer in creamy spinach gravy", "12.49", "Curries", "INDIAN"),
                    new ProductSeed("Vegetable Biryani", "Fragrant basmati rice with vegetables", "11.99", "Biryanis", "BIRYANI"),
                    new ProductSeed("Chicken Biryani", "Basmati rice, spiced chicken", "13.99", "Biryanis", "BIRYANI"),
                    new ProductSeed("Mutton Biryani", "Slow-cooked mutton, fragrant rice", "15.99", "Biryanis", "BIRYANI"),
                    new ProductSeed("Vegetable Samosas", "Crispy pastry, spiced potato filling", "5.99", "Appetizers", "INDIAN"),
                    new ProductSeed("Chicken Tikka", "Char-grilled marinated chicken", "12.99", "Appetizers", "INDIAN"),
                    new ProductSeed("Onion Bhaji", "Crispy onion fritters", "5.49", "Appetizers", "INDIAN"),
                    new ProductSeed("Garlic Naan", "Fresh baked flatbread", "3.49", "Breads", "BAKERY"),
                    new ProductSeed("Butter Naan", "Soft flatbread brushed with butter", "3.49", "Breads", "BAKERY"),
                    new ProductSeed("Tandoori Roti", "Whole wheat clay-oven flatbread", "2.99", "Breads", "BAKERY"),
                    new ProductSeed("Mango Lassi", "Sweet yogurt mango drink", "3.99", "Drinks", "DRINKS"),
                    new ProductSeed("Masala Chai", "Spiced Indian tea", "2.99", "Drinks", "DRINKS")
            )),
            new StoreSeed("Taco Fiesta", Vertical.FOOD, "MEXICAN", 4.3, 22, 0.006, 0.017, List.of(
                    new ProductSeed("Carne Asada Tacos (3)", "Grilled steak, onion, cilantro", "9.49", "Tacos", "MEXICAN"),
                    new ProductSeed("Fish Tacos (3)", "Battered fish, cabbage slaw", "10.49", "Tacos", "MEXICAN"),
                    new ProductSeed("Al Pastor Tacos (3)", "Marinated pork, pineapple", "9.99", "Tacos", "MEXICAN"),
                    new ProductSeed("Chicken Burrito", "Rice, beans, cheese, salsa", "8.99", "Burritos & Bowls", "MEXICAN"),
                    new ProductSeed("Burrito Bowl", "Rice, beans, meat of choice, toppings", "9.99", "Burritos & Bowls", "MEXICAN"),
                    new ProductSeed("Chips & Guacamole", "Fresh made guacamole", "5.99", "Appetizers", "MEXICAN"),
                    new ProductSeed("Elote", "Grilled Mexican street corn", "4.99", "Appetizers", "MEXICAN"),
                    new ProductSeed("Quesadilla", "Melted cheese, flour tortilla", "7.49", "Appetizers", "MEXICAN"),
                    new ProductSeed("Horchata", "Sweet rice & cinnamon drink", "3.49", "Drinks", "DRINKS"),
                    new ProductSeed("Agua Fresca", "Fresh fruit water, seasonal flavor", "3.49", "Drinks", "DRINKS")
            )),
            new StoreSeed("Dim Sum House", Vertical.FOOD, "CHINESE", 4.6, 28, 0.021, 0.008, List.of(
                    new ProductSeed("Pork Dumplings (8)", "Steamed pork & chive dumplings", "8.99", "Dim Sum", "CHINESE"),
                    new ProductSeed("Shrimp Har Gow (6)", "Steamed shrimp dumplings", "9.49", "Dim Sum", "CHINESE"),
                    new ProductSeed("Spring Rolls (4)", "Crispy vegetable spring rolls", "5.99", "Dim Sum", "CHINESE"),
                    new ProductSeed("Kung Pao Chicken", "Spicy stir-fry with peanuts", "12.49", "Mains", "CHINESE"),
                    new ProductSeed("Sweet & Sour Pork", "Crispy pork, pineapple sauce", "11.99", "Mains", "CHINESE"),
                    new ProductSeed("Fried Rice", "Wok-tossed with egg & scallion", "9.49", "Mains", "CHINESE"),
                    new ProductSeed("Hot & Sour Soup", "Tangy, spicy classic soup", "4.49", "Soups", "CHINESE"),
                    new ProductSeed("Wonton Soup", "Pork wontons in savory broth", "4.99", "Soups", "CHINESE"),
                    new ProductSeed("Jasmine Tea", "Fragrant, freshly brewed", "2.49", "Drinks", "DRINKS"),
                    new ProductSeed("Iced Lychee Tea", "Sweet and fruity", "3.49", "Drinks", "DRINKS")
            )),
            new StoreSeed("Golden Wok", Vertical.FOOD, "CHINESE", 4.3, 26, -0.017, 0.023, List.of(
                    new ProductSeed("General Tso's Chicken", "Crispy chicken, sweet-spicy glaze", "12.99", "Mains", "CHINESE"),
                    new ProductSeed("Orange Chicken", "Crispy chicken, citrus glaze", "12.49", "Mains", "CHINESE"),
                    new ProductSeed("Beef & Broccoli", "Tender beef, savory brown sauce", "13.49", "Mains", "CHINESE"),
                    new ProductSeed("Chow Mein", "Stir-fried noodles & vegetables", "10.49", "Noodles & Rice", "CHINESE"),
                    new ProductSeed("Vegetable Lo Mein", "Soft noodles, mixed vegetables", "9.99", "Noodles & Rice", "CHINESE"),
                    new ProductSeed("Fried Rice", "Wok-tossed with egg & scallion", "9.49", "Noodles & Rice", "CHINESE"),
                    new ProductSeed("Egg Rolls (4)", "Crispy pork & cabbage rolls", "5.49", "Appetizers", "CHINESE"),
                    new ProductSeed("Crab Rangoon (6)", "Cream cheese wontons, fried", "6.49", "Appetizers", "CHINESE"),
                    new ProductSeed("Wonton Soup", "Pork wontons in savory broth", "4.99", "Soups", "CHINESE"),
                    new ProductSeed("Egg Drop Soup", "Silky egg ribbons, savory broth", "3.99", "Soups", "CHINESE")
            )),
            new StoreSeed("Sunrise Cafe", Vertical.FOOD, "BREAKFAST", 4.7, 18, 0.003, -0.026, List.of(
                    new ProductSeed("Stack of Pancakes", "Buttermilk pancakes, maple syrup", "8.49", "Breakfast Classics", "BREAKFAST"),
                    new ProductSeed("Avocado Toast", "Sourdough, smashed avocado, chili flakes", "9.49", "Breakfast Classics", "BREAKFAST"),
                    new ProductSeed("Classic Omelette", "3-egg omelette, cheese & herbs", "8.99", "Breakfast Classics", "BREAKFAST"),
                    new ProductSeed("Belgian Waffles", "Crispy waffles, berries & cream", "9.99", "Breakfast Classics", "BREAKFAST"),
                    new ProductSeed("Butter Croissant", "Flaky, freshly baked", "3.99", "Pastries", "BAKERY"),
                    new ProductSeed("Blueberry Muffin", "Bakery fresh, bursting with berries", "3.49", "Pastries", "BAKERY"),
                    new ProductSeed("Fresh Brewed Coffee", "Locally roasted, medium blend", "3.49", "Drinks", "DRINKS"),
                    new ProductSeed("Fresh Orange Juice", "Cold-pressed, no added sugar", "3.99", "Drinks", "DRINKS"),
                    new ProductSeed("Latte", "Espresso with steamed milk", "4.49", "Drinks", "DRINKS")
            )),

            new StoreSeed("Noodle Bar", Vertical.FOOD, "RAMEN", 4.5, 24, 0.031, -0.011, List.of(
                    new ProductSeed("Shoyu Ramen", "Soy-based broth, chashu, nori", "12.99", "Ramen", "RAMEN"),
                    new ProductSeed("Spicy Miso Ramen", "Rich miso broth with chili oil", "13.49", "Ramen", "RAMEN"),
                    new ProductSeed("Vegetable Ramen", "Light broth, seasonal vegetables", "11.99", "Ramen", "RAMEN"),
                    new ProductSeed("Chicken Karaage", "Japanese fried chicken bites", "7.99", "Appetizers", "RAMEN"),
                    new ProductSeed("Gyoza (6)", "Pan-fried pork dumplings", "6.99", "Appetizers", "SUSHI"),
                    new ProductSeed("Iced Oolong Tea", "Roasted, lightly sweet", "2.99", "Drinks", "DRINKS")
            )),
            new StoreSeed("Casa Mexicana", Vertical.FOOD, "MEXICAN", 4.4, 24, -0.027, 0.014, List.of(
                    new ProductSeed("Chicken Enchiladas", "Rolled tortillas, red sauce, cheese", "11.49", "Mains", "MEXICAN"),
                    new ProductSeed("Beef Barbacoa Tacos (3)", "Slow-braised beef, onion, cilantro", "10.49", "Tacos", "MEXICAN"),
                    new ProductSeed("Veggie Fajitas", "Grilled peppers & onions, tortillas", "10.99", "Mains", "MEXICAN"),
                    new ProductSeed("Nachos Supreme", "Loaded with cheese, jalapeno, salsa", "8.99", "Appetizers", "MEXICAN"),
                    new ProductSeed("Tres Leches Cake", "Classic soaked sponge cake", "5.99", "Desserts", "DESSERT"),
                    new ProductSeed("Jamaica Agua Fresca", "Hibiscus flower water", "3.49", "Drinks", "DRINKS")
            )),

            // ---------- GROCERY ----------
            new StoreSeed("FreshMart Grocery", Vertical.GROCERY, "FRUIT", 4.5, 15, -0.012, -0.005, List.of(
                    new ProductSeed("Fresh Bananas (1 bunch)", "Ripe yellow bananas", "2.49", "Fruits & Vegetables", "FRUIT"),
                    new ProductSeed("Red Apples (3 lb)", "Crisp and sweet", "4.29", "Fruits & Vegetables", "FRUIT"),
                    new ProductSeed("Whole Milk (1 gallon)", "Farm fresh whole milk", "3.49", "Dairy & Bakery", "GROCERY_GENERAL"),
                    new ProductSeed("Sourdough Bread", "Freshly baked loaf", "4.29", "Dairy & Bakery", "BAKERY"),
                    new ProductSeed("Cheddar Cheese Block", "Sharp cheddar, 8oz", "5.49", "Dairy & Bakery", "GROCERY_GENERAL"),
                    new ProductSeed("Greek Yogurt (32oz)", "Plain, high-protein", "5.99", "Dairy & Bakery", "GROCERY_GENERAL"),
                    new ProductSeed("Cereal (Family Size)", "Whole grain flakes", "4.79", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("Orange Juice (64oz)", "100% pure squeezed", "4.99", "Beverages", "DRINKS")
            )),
            new StoreSeed("Green Valley Produce", Vertical.GROCERY, "VEGETABLES", 4.3, 18, 0.006, 0.018, List.of(
                    new ProductSeed("Mixed Vegetables Box", "Seasonal vegetable assortment", "8.99", "Fruits & Vegetables", "VEGETABLES"),
                    new ProductSeed("Avocados (4 pack)", "Ready to eat", "6.99", "Fruits & Vegetables", "VEGETABLES"),
                    new ProductSeed("Baby Spinach", "Washed and ready, 5oz", "3.99", "Fruits & Vegetables", "VEGETABLES"),
                    new ProductSeed("Bell Peppers (3 pack)", "Red, yellow & green", "4.99", "Fruits & Vegetables", "VEGETABLES"),
                    new ProductSeed("Carrots (2 lb)", "Crisp and fresh", "2.99", "Fruits & Vegetables", "VEGETABLES"),
                    new ProductSeed("Strawberries (1 lb)", "Sweet and juicy", "4.49", "Fruits & Vegetables", "FRUIT"),
                    new ProductSeed("Farm Eggs (dozen)", "Free-range eggs", "5.49", "Dairy & Bakery", "VEGETABLES")
            )),
            new StoreSeed("QuickMart Express", Vertical.GROCERY, "GROCERY_GENERAL", 4.1, 10, -0.019, 0.009, List.of(
                    new ProductSeed("Potato Chips", "Classic salted, family size", "3.99", "Snacks", "GROCERY_GENERAL"),
                    new ProductSeed("Trail Mix", "Nuts, raisins & chocolate", "6.49", "Snacks", "GROCERY_GENERAL"),
                    new ProductSeed("Microwave Popcorn (3 pack)", "Butter flavor", "4.29", "Snacks", "GROCERY_GENERAL"),
                    new ProductSeed("Instant Noodles (5 pack)", "Quick and easy noodles", "4.49", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("Sparkling Water (6 pack)", "Lightly carbonated", "5.99", "Beverages", "DRINKS"),
                    new ProductSeed("Energy Drink (4 pack)", "Sugar-free formula", "7.99", "Beverages", "DRINKS")
            )),
            new StoreSeed("Organic Basket", Vertical.GROCERY, "VEGETABLES", 4.7, 20, 0.020, -0.016, List.of(
                    new ProductSeed("Organic Kale Bunch", "Locally grown organic kale", "3.49", "Fruits & Vegetables", "VEGETABLES"),
                    new ProductSeed("Organic Broccoli", "Fresh crowns, 1 lb", "3.99", "Fruits & Vegetables", "VEGETABLES"),
                    new ProductSeed("Organic Blueberries", "Pint, antioxidant-rich", "5.99", "Fruits & Vegetables", "FRUIT"),
                    new ProductSeed("Organic Quinoa (2 lb)", "Whole grain protein", "8.99", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("Organic Honey Jar", "Raw and unfiltered, 16oz", "9.99", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("Organic Almond Milk", "Unsweetened, 64oz", "5.49", "Beverages", "DRINKS")
            )),
            new StoreSeed("Value Grocer", Vertical.GROCERY, "GROCERY_GENERAL", 4.0, 12, -0.025, -0.019, List.of(
                    new ProductSeed("White Rice (5 lb)", "Long grain, pantry staple", "6.99", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("Canned Black Beans (4 pack)", "Ready to use", "3.99", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("Spaghetti Pasta (2 pack)", "Classic Italian pasta", "3.49", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("Cooking Oil (48oz)", "Vegetable oil blend", "6.49", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("Granulated Sugar (4 lb)", "Fine white sugar", "3.99", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("All-Purpose Flour (5 lb)", "Baking essential", "4.49", "Pantry", "GROCERY_GENERAL")
            )),
            new StoreSeed("Farmers Market Co", Vertical.GROCERY, "FRUIT", 4.8, 22, 0.026, 0.013, List.of(
                    new ProductSeed("Heirloom Tomatoes", "Vine-ripened, 1.5 lb", "5.49", "Fruits & Vegetables", "VEGETABLES"),
                    new ProductSeed("Sweet Corn (4 ears)", "Locally grown", "3.99", "Fruits & Vegetables", "VEGETABLES"),
                    new ProductSeed("Fresh Basil Bunch", "Aromatic, locally grown", "2.49", "Fruits & Vegetables", "VEGETABLES"),
                    new ProductSeed("Peaches (2 lb)", "Juicy and ripe", "5.99", "Fruits & Vegetables", "FRUIT"),
                    new ProductSeed("Watermelon (whole)", "Sweet seedless", "6.99", "Fruits & Vegetables", "FRUIT"),
                    new ProductSeed("Farm Fresh Eggs (dozen)", "Pasture-raised", "6.49", "Dairy & Bakery", "VEGETABLES")
            )),

            new StoreSeed("Neighborhood Grocer", Vertical.GROCERY, "GROCERY_GENERAL", 4.2, 14, 0.033, 0.024, List.of(
                    new ProductSeed("Whole Wheat Bread", "Soft sandwich loaf", "3.79", "Dairy & Bakery", "BAKERY"),
                    new ProductSeed("Peanut Butter (16oz)", "Creamy, no added sugar", "4.99", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("Strawberry Jam (12oz)", "Made with real fruit", "3.99", "Pantry", "GROCERY_GENERAL"),
                    new ProductSeed("Orange Juice (64oz)", "100% pure squeezed", "4.99", "Beverages", "DRINKS"),
                    new ProductSeed("Paper Towels (6 rolls)", "Extra absorbent", "8.99", "Household", "GROCERY_GENERAL")
            )),
            new StoreSeed("Berry Fields", Vertical.GROCERY, "FRUIT", 4.6, 17, -0.023, -0.030, List.of(
                    new ProductSeed("Blueberries (pint)", "Sweet and plump", "4.99", "Fruits & Vegetables", "FRUIT"),
                    new ProductSeed("Raspberries (6oz)", "Fresh and tart", "3.99", "Fruits & Vegetables", "FRUIT"),
                    new ProductSeed("Mixed Berry Pack", "Strawberries, blueberries, blackberries", "7.99", "Fruits & Vegetables", "FRUIT"),
                    new ProductSeed("Fresh Pineapple", "Peeled and cored, ready to eat", "4.49", "Fruits & Vegetables", "FRUIT"),
                    new ProductSeed("Green Grapes (2 lb)", "Seedless, crisp", "5.49", "Fruits & Vegetables", "FRUIT")
            )),

            // ---------- MEDICINE ----------
            new StoreSeed("City Pharmacy", Vertical.MEDICINE, "PHARMACY", 4.7, 20, -0.005, 0.008, List.of(
                    new ProductSeed("Pain Relief Tablets", "Fast-acting pain relief, 20 count", "6.99", "Pain & Fever", "PHARMACY"),
                    new ProductSeed("Allergy Relief Tablets", "24-hour non-drowsy relief", "9.49", "Cold & Allergy", "PHARMACY"),
                    new ProductSeed("Multivitamins", "Daily multivitamin, 60 count", "12.99", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("First Aid Kit", "Essential home first aid kit", "15.99", "First Aid", "PHARMACY"),
                    new ProductSeed("Hand Sanitizer", "70% alcohol, 250ml", "4.49", "Personal Care", "PHARMACY")
            )),
            new StoreSeed("Wellness Rx", Vertical.MEDICINE, "VITAMINS", 4.6, 22, 0.011, -0.014, List.of(
                    new ProductSeed("Cough Syrup", "Soothing relief, 100ml", "7.49", "Cold & Allergy", "PHARMACY"),
                    new ProductSeed("Vitamin C Gummies", "Immune support, 90 count", "8.49", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("Bandage Strips (50 pack)", "Assorted sizes", "3.99", "First Aid", "PHARMACY"),
                    new ProductSeed("Digital Thermometer", "Fast-read thermometer", "9.99", "Personal Care", "PHARMACY")
            )),
            new StoreSeed("MedPlus Pharmacy", Vertical.MEDICINE, "PHARMACY", 4.4, 25, -0.021, -0.003, List.of(
                    new ProductSeed("Antacid Tablets", "Fast heartburn relief, 40 count", "5.99", "Pain & Fever", "PHARMACY"),
                    new ProductSeed("Omega-3 Fish Oil", "Heart health support, 90 softgels", "11.99", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("Face Masks (10 pack)", "3-ply disposable masks", "6.99", "Personal Care", "PHARMACY"),
                    new ProductSeed("Reading Glasses +2.0", "Lightweight frame", "12.99", "Personal Care", "PHARMACY")
            )),
            new StoreSeed("HealthFirst Drugstore", Vertical.MEDICINE, "VITAMINS", 4.5, 18, 0.004, 0.021, List.of(
                    new ProductSeed("Throat Lozenges", "Honey lemon flavor, 24 count", "3.49", "Cold & Allergy", "PHARMACY"),
                    new ProductSeed("Electrolyte Powder", "Rapid rehydration, 10 packets", "7.99", "Personal Care", "PHARMACY"),
                    new ProductSeed("Blood Pressure Monitor", "Digital, home use", "24.99", "Personal Care", "PHARMACY")
            )),
            new StoreSeed("QuickCare Pharmacy", Vertical.MEDICINE, "PHARMACY", 4.5, 16, 0.017, -0.024, List.of(
                    new ProductSeed("Ibuprofen Tablets", "200mg, 50 count", "5.99", "Pain & Fever", "PHARMACY"),
                    new ProductSeed("Antihistamine Tablets", "24-hour allergy relief, 30 count", "8.49", "Cold & Allergy", "PHARMACY"),
                    new ProductSeed("Nasal Spray", "Fast congestion relief", "7.49", "Cold & Allergy", "PHARMACY"),
                    new ProductSeed("Cold & Flu Relief", "Daytime & nighttime combo", "9.99", "Cold & Allergy", "PHARMACY"),
                    new ProductSeed("Eye Drops", "Lubricating, redness relief", "6.49", "Personal Care", "PHARMACY"),
                    new ProductSeed("Antiseptic Wipes (40 pack)", "For minor cuts & scrapes", "4.99", "First Aid", "PHARMACY")
            )),
            new StoreSeed("Family Health Drugstore", Vertical.MEDICINE, "VITAMINS", 4.6, 19, -0.028, 0.011, List.of(
                    new ProductSeed("Kids Chewable Vitamins", "Multivitamin gummies", "9.99", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("Prenatal Vitamins", "Daily support, 90 count", "14.99", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("Probiotic Capsules", "Digestive health, 30 count", "13.99", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("Melatonin Gummies", "Sleep support, 60 count", "8.99", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("Zinc Tablets", "Immune support, 100 count", "7.49", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("Baby Digital Thermometer", "Fast & gentle readings", "11.99", "Personal Care", "PHARMACY")
            )),

            new StoreSeed("Corner Drugstore", Vertical.MEDICINE, "PHARMACY", 4.3, 21, 0.026, -0.017, List.of(
                    new ProductSeed("Sinus Relief Tablets", "Fast-acting decongestant", "6.49", "Cold & Allergy", "PHARMACY"),
                    new ProductSeed("Motion Sickness Tablets", "Non-drowsy formula", "5.49", "Pain & Fever", "PHARMACY"),
                    new ProductSeed("Adhesive Bandages (100 pack)", "Assorted sizes", "4.99", "First Aid", "PHARMACY"),
                    new ProductSeed("Reusable Ice Pack", "Flexible gel pack", "6.99", "First Aid", "PHARMACY")
            )),
            new StoreSeed("Vital Health Pharmacy", Vertical.MEDICINE, "VITAMINS", 4.7, 18, -0.015, 0.029, List.of(
                    new ProductSeed("Vitamin D3 Softgels", "2000 IU, 100 count", "9.99", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("Magnesium Tablets", "Muscle & nerve support", "10.99", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("Collagen Powder", "Unflavored, 30 servings", "18.99", "Vitamins & Supplements", "VITAMINS"),
                    new ProductSeed("Kids Probiotic Drops", "Daily digestive support", "13.99", "Vitamins & Supplements", "VITAMINS")
            )),

            // ---------- SHOP (general) ----------
            new StoreSeed("Daily Essentials Shop", Vertical.SHOP, "HOME", 4.2, 25, -0.014, -0.011, List.of(
                    new ProductSeed("Cotton T-Shirt", "Everyday soft cotton tee", "14.99", "Clothing", "FASHION"),
                    new ProductSeed("Notebook Set", "3-pack ruled notebooks", "7.99", "Stationery", "STATIONERY"),
                    new ProductSeed("Phone Charger Cable", "USB-C fast charging cable", "8.99", "Electronics Accessories", "ELECTRONICS"),
                    new ProductSeed("Umbrella", "Compact windproof umbrella", "13.99", "Home Essentials", "HOME"),
                    new ProductSeed("Laundry Detergent", "64 loads, fresh scent", "11.99", "Home Essentials", "HOME")
            )),
            new StoreSeed("Corner Mart", Vertical.SHOP, "HOME", 4.0, 15, 0.017, 0.006, List.of(
                    new ProductSeed("Scented Candle", "Lavender & vanilla blend", "10.99", "Home Essentials", "HOME"),
                    new ProductSeed("Reusable Water Bottle", "1L stainless steel bottle", "13.99", "Home Essentials", "HOME"),
                    new ProductSeed("Dish Soap", "Grease-cutting formula, 24oz", "3.99", "Home Essentials", "HOME"),
                    new ProductSeed("AA Batteries (8 pack)", "Long-lasting alkaline", "6.99", "Electronics Accessories", "ELECTRONICS")
            )),
            new StoreSeed("Home Basics", Vertical.SHOP, "HOME", 4.3, 28, -0.022, 0.014, List.of(
                    new ProductSeed("Throw Pillow Cover", "Woven cotton, 18x18in", "9.99", "Home Essentials", "HOME"),
                    new ProductSeed("Kitchen Towel Set", "Absorbent cotton, 4 pack", "8.49", "Home Essentials", "HOME"),
                    new ProductSeed("LED Desk Lamp", "Adjustable brightness", "17.99", "Home Essentials", "HOME"),
                    new ProductSeed("Storage Baskets (2 pack)", "Woven seagrass baskets", "19.99", "Home Essentials", "HOME")
            )),
            new StoreSeed("Stationery World", Vertical.SHOP, "STATIONERY", 4.4, 20, 0.009, -0.020, List.of(
                    new ProductSeed("Gel Pen Set (10 pack)", "Smooth writing, assorted colors", "6.99", "Stationery", "STATIONERY"),
                    new ProductSeed("Sticky Notes Pack", "5 colors, 500 sheets", "4.49", "Stationery", "STATIONERY"),
                    new ProductSeed("Desk Organizer", "Mesh metal organizer", "15.99", "Stationery", "STATIONERY")
            )),
            new StoreSeed("Hardware Helper", Vertical.SHOP, "HOME", 4.3, 24, -0.030, -0.008, List.of(
                    new ProductSeed("Tool Set (28 piece)", "Home essential tool kit", "34.99", "Tools", "HOME"),
                    new ProductSeed("Duct Tape (3 pack)", "Heavy duty, all-purpose", "8.99", "Tools", "HOME"),
                    new ProductSeed("LED Light Bulbs (4 pack)", "Energy-efficient, warm white", "12.99", "Home Essentials", "HOME"),
                    new ProductSeed("Extension Cord (25ft)", "Indoor/outdoor rated", "16.99", "Tools", "HOME"),
                    new ProductSeed("Super Glue (3 pack)", "Fast-bonding formula", "5.99", "Tools", "HOME"),
                    new ProductSeed("Measuring Tape (25ft)", "Retractable, locking", "9.99", "Tools", "HOME")
            )),
            new StoreSeed("Toy Box", Vertical.SHOP, "HOME", 4.6, 21, 0.024, 0.020, List.of(
                    new ProductSeed("Building Blocks Set", "250-piece creative set", "24.99", "Toys & Games", "HOME"),
                    new ProductSeed("500-Piece Puzzle", "Landscape scene puzzle", "13.99", "Toys & Games", "HOME"),
                    new ProductSeed("Remote Control Car", "Rechargeable, off-road", "29.99", "Toys & Games", "HOME"),
                    new ProductSeed("Family Board Game", "Fun for ages 8+", "19.99", "Toys & Games", "HOME"),
                    new ProductSeed("Stuffed Animal", "Soft plush bear, 12in", "12.99", "Toys & Games", "HOME"),
                    new ProductSeed("Art Supplies Kit", "Crayons, markers & paper", "16.99", "Toys & Games", "STATIONERY")
            )),

            new StoreSeed("Everyday Needs", Vertical.SHOP, "HOME", 4.1, 19, 0.028, -0.026, List.of(
                    new ProductSeed("Trash Bags (30 count)", "Heavy duty, drawstring", "9.99", "Home Essentials", "HOME"),
                    new ProductSeed("Multi-Surface Cleaner", "24oz spray bottle", "5.49", "Home Essentials", "HOME"),
                    new ProductSeed("Aluminum Foil (75 sq ft)", "Extra strength", "4.99", "Home Essentials", "HOME"),
                    new ProductSeed("Sponges (6 pack)", "Non-scratch scrub sponges", "3.99", "Home Essentials", "HOME")
            )),
            new StoreSeed("Craft & Paper", Vertical.SHOP, "STATIONERY", 4.5, 22, -0.019, -0.032, List.of(
                    new ProductSeed("Watercolor Paint Set", "24 vivid colors with brush", "12.99", "Stationery", "STATIONERY"),
                    new ProductSeed("Spiral Sketchbook", "100 sheets, heavyweight paper", "8.99", "Stationery", "STATIONERY"),
                    new ProductSeed("Washi Tape Set (10 rolls)", "Decorative patterns", "9.99", "Stationery", "STATIONERY"),
                    new ProductSeed("Fountain Pen", "Smooth medium nib", "14.99", "Stationery", "STATIONERY")
            )),

            // ---------- ELECTRONICS ----------
            new StoreSeed("TechHub Electronics", Vertical.ELECTRONICS, "ELECTRONICS", 4.5, 30, 0.013, 0.010, List.of(
                    new ProductSeed("Wireless Earbuds", "Bluetooth 5.0, 20h battery", "29.99", "Audio", "ELECTRONICS"),
                    new ProductSeed("Bluetooth Speaker", "Waterproof, 12h playtime", "34.99", "Audio", "ELECTRONICS"),
                    new ProductSeed("Portable Power Bank", "10000mAh fast charging", "22.99", "Accessories", "ELECTRONICS"),
                    new ProductSeed("USB-C Hub", "7-in-1 multiport adapter", "27.99", "Computing", "ELECTRONICS"),
                    new ProductSeed("Wireless Mouse", "Ergonomic, silent click", "16.99", "Computing", "ELECTRONICS")
            )),
            new StoreSeed("Gadget Zone", Vertical.ELECTRONICS, "HEADPHONES", 4.3, 26, -0.009, -0.017, List.of(
                    new ProductSeed("Smart Watch", "Fitness tracking & notifications", "49.99", "Accessories", "ELECTRONICS"),
                    new ProductSeed("Wireless Charging Pad", "10W fast wireless charging", "18.99", "Accessories", "ELECTRONICS"),
                    new ProductSeed("Phone Tripod Stand", "Adjustable, for vlogging", "13.99", "Accessories", "ELECTRONICS"),
                    new ProductSeed("Noise Cancelling Headphones", "Over-ear, 30h battery", "59.99", "Audio", "HEADPHONES")
            )),
            new StoreSeed("Mobile World", Vertical.ELECTRONICS, "ELECTRONICS", 4.2, 24, 0.024, 0.002, List.of(
                    new ProductSeed("Phone Case", "Shockproof clear case", "9.99", "Accessories", "ELECTRONICS"),
                    new ProductSeed("Tempered Glass Screen Protector", "9H hardness, easy install", "6.99", "Accessories", "ELECTRONICS"),
                    new ProductSeed("Car Phone Mount", "Universal dashboard mount", "11.99", "Accessories", "ELECTRONICS")
            )),
            new StoreSeed("Camera Corner", Vertical.ELECTRONICS, "ELECTRONICS", 4.7, 27, -0.033, 0.015, List.of(
                    new ProductSeed("Digital Camera", "24MP compact digital camera", "199.99", "Cameras", "ELECTRONICS"),
                    new ProductSeed("Camera Tripod", "Adjustable aluminum tripod", "24.99", "Cameras", "ELECTRONICS"),
                    new ProductSeed("64GB Memory Card", "High-speed storage card", "14.99", "Cameras", "ELECTRONICS"),
                    new ProductSeed("Camera Bag", "Padded protective case", "27.99", "Cameras", "ELECTRONICS"),
                    new ProductSeed("Ring Light", "10in LED with stand", "22.99", "Accessories", "ELECTRONICS"),
                    new ProductSeed("Lens Cleaning Kit", "Complete cleaning set", "9.99", "Cameras", "ELECTRONICS")
            )),
            new StoreSeed("Gaming Hub", Vertical.ELECTRONICS, "HEADPHONES", 4.6, 23, 0.019, -0.028, List.of(
                    new ProductSeed("Gaming Headset", "7.1 surround sound, mic", "39.99", "Gaming", "HEADPHONES"),
                    new ProductSeed("Gaming Mouse", "RGB, programmable buttons", "29.99", "Gaming", "ELECTRONICS"),
                    new ProductSeed("Mechanical Keyboard", "RGB backlit, tactile switches", "54.99", "Gaming", "ELECTRONICS"),
                    new ProductSeed("Wireless Controller", "Compatible with PC & console", "34.99", "Gaming", "ELECTRONICS"),
                    new ProductSeed("Extended Mouse Pad", "Large, non-slip base", "12.99", "Gaming", "ELECTRONICS"),
                    new ProductSeed("HD Webcam", "1080p with built-in mic", "24.99", "Computing", "ELECTRONICS")
            )),

            new StoreSeed("Circuit City Express", Vertical.ELECTRONICS, "ELECTRONICS", 4.4, 25, 0.030, 0.019, List.of(
                    new ProductSeed("Portable SSD (1TB)", "USB-C, compact external drive", "79.99", "Computing", "ELECTRONICS"),
                    new ProductSeed("Laptop Sleeve", "13-14in neoprene sleeve", "17.99", "Accessories", "ELECTRONICS"),
                    new ProductSeed("Smart Plug (2 pack)", "Wi-Fi enabled, app controlled", "19.99", "Accessories", "ELECTRONICS"),
                    new ProductSeed("HDMI Cable (6ft)", "4K high-speed cable", "8.99", "Accessories", "ELECTRONICS")
            )),
            new StoreSeed("SoundWave Audio", Vertical.ELECTRONICS, "HEADPHONES", 4.6, 22, -0.024, -0.012, List.of(
                    new ProductSeed("Studio Headphones", "Over-ear, flat response", "64.99", "Audio", "HEADPHONES"),
                    new ProductSeed("True Wireless Earbuds", "ANC, 24h case battery", "44.99", "Audio", "HEADPHONES"),
                    new ProductSeed("Portable Mini Speaker", "Clip-on, waterproof", "19.99", "Audio", "ELECTRONICS"),
                    new ProductSeed("Headphone Stand", "Aluminum desktop stand", "14.99", "Accessories", "ELECTRONICS")
            )),

            // ---------- FASHION ----------
            new StoreSeed("Urban Threads", Vertical.FASHION, "FASHION", 4.4, 30, -0.016, 0.019, List.of(
                    new ProductSeed("Denim Jacket", "Classic fit, medium wash", "44.99", "Clothing", "FASHION"),
                    new ProductSeed("Graphic Hoodie", "Soft fleece, unisex fit", "34.99", "Clothing", "FASHION"),
                    new ProductSeed("Slim Fit Jeans", "Stretch denim, dark wash", "39.99", "Clothing", "FASHION"),
                    new ProductSeed("Baseball Cap", "Adjustable, embroidered logo", "16.99", "Accessories", "FASHION")
            )),
            new StoreSeed("StyleHouse", Vertical.FASHION, "FASHION", 4.6, 32, 0.007, -0.022, List.of(
                    new ProductSeed("Floral Summer Dress", "Lightweight, breathable fabric", "36.99", "Clothing", "FASHION"),
                    new ProductSeed("Silk Scarf", "Printed pattern, versatile", "19.99", "Accessories", "FASHION"),
                    new ProductSeed("Leather Handbag", "Structured tote, faux leather", "49.99", "Accessories", "FASHION"),
                    new ProductSeed("Sunglasses", "UV400 protection, classic style", "22.99", "Accessories", "FASHION")
            )),
            new StoreSeed("Sneaker Spot", Vertical.FASHION, "SNEAKERS", 4.5, 28, -0.010, -0.009, List.of(
                    new ProductSeed("Running Sneakers", "Lightweight cushioned sole", "54.99", "Footwear", "SNEAKERS"),
                    new ProductSeed("Canvas Sneakers", "Classic low-top style", "39.99", "Footwear", "SNEAKERS"),
                    new ProductSeed("No-Show Socks (6 pack)", "Breathable cotton blend", "9.99", "Accessories", "FASHION")
            )),
            new StoreSeed("Kids Corner", Vertical.FASHION, "FASHION", 4.5, 26, 0.029, 0.017, List.of(
                    new ProductSeed("Kids Graphic T-Shirt", "Soft cotton, fun prints", "11.99", "Clothing", "FASHION"),
                    new ProductSeed("Kids Denim Jeans", "Durable, adjustable waist", "19.99", "Clothing", "FASHION"),
                    new ProductSeed("Kids Puffer Jacket", "Warm, water-resistant", "29.99", "Clothing", "FASHION"),
                    new ProductSeed("Kids Sneakers", "Velcro strap, lightweight", "24.99", "Footwear", "SNEAKERS"),
                    new ProductSeed("Rain Boots", "Waterproof, fun colors", "16.99", "Footwear", "FASHION"),
                    new ProductSeed("School Backpack", "Durable with multiple pockets", "22.99", "Accessories", "FASHION")
            )),
            new StoreSeed("Accessory Avenue", Vertical.FASHION, "FASHION", 4.4, 24, -0.031, -0.014, List.of(
                    new ProductSeed("Leather Belt", "Genuine leather, classic buckle", "18.99", "Accessories", "FASHION"),
                    new ProductSeed("Wrist Watch", "Minimalist analog design", "39.99", "Accessories", "FASHION"),
                    new ProductSeed("Beanie Hat", "Soft knit, one size", "12.99", "Accessories", "FASHION"),
                    new ProductSeed("Wool Scarf", "Warm winter accessory", "17.99", "Accessories", "FASHION"),
                    new ProductSeed("Bifold Wallet", "Genuine leather, RFID blocking", "24.99", "Accessories", "FASHION"),
                    new ProductSeed("Canvas Tote Bag", "Durable everyday tote", "14.99", "Accessories", "FASHION")
            )),

            new StoreSeed("Trend Setters", Vertical.FASHION, "FASHION", 4.3, 27, 0.021, -0.033, List.of(
                    new ProductSeed("Oversized Blazer", "Tailored fit, versatile layer", "49.99", "Clothing", "FASHION"),
                    new ProductSeed("Pleated Midi Skirt", "Lightweight, flowy fabric", "32.99", "Clothing", "FASHION"),
                    new ProductSeed("Crossbody Bag", "Compact, adjustable strap", "27.99", "Accessories", "FASHION"),
                    new ProductSeed("Statement Earrings", "Gold-tone, lightweight", "14.99", "Accessories", "FASHION")
            )),
            new StoreSeed("Foot Locker Lite", Vertical.FASHION, "SNEAKERS", 4.5, 26, -0.011, 0.032, List.of(
                    new ProductSeed("High-Top Sneakers", "Retro basketball style", "59.99", "Footwear", "SNEAKERS"),
                    new ProductSeed("Slip-On Sneakers", "Easy on-off, memory foam", "44.99", "Footwear", "SNEAKERS"),
                    new ProductSeed("Athletic Socks (6 pack)", "Cushioned, moisture-wicking", "11.99", "Accessories", "FASHION"),
                    new ProductSeed("Sneaker Cleaning Kit", "Brush, solution & wipes", "12.99", "Accessories", "SNEAKERS")
            )),

            // ---------- BEAUTY ----------
            new StoreSeed("Glow Beauty Store", Vertical.BEAUTY, "COSMETICS", 4.6, 22, 0.018, 0.015, List.of(
                    new ProductSeed("Matte Lipstick", "Long-lasting, rich pigment", "13.99", "Makeup", "COSMETICS"),
                    new ProductSeed("Makeup Brush Set", "10-piece professional set", "18.99", "Makeup", "COSMETICS"),
                    new ProductSeed("Perfume Spray", "Floral fragrance, 50ml", "29.99", "Personal Care", "COSMETICS"),
                    new ProductSeed("Facial Cleanser", "Gentle foaming wash, 8oz", "11.99", "Skincare", "SKINCARE")
            )),
            new StoreSeed("Pure Skincare", Vertical.BEAUTY, "SKINCARE", 4.7, 25, -0.006, -0.024, List.of(
                    new ProductSeed("Vitamin C Serum", "Brightening facial serum, 1oz", "19.99", "Skincare", "SKINCARE"),
                    new ProductSeed("Daily Moisturizer SPF 30", "Lightweight, non-greasy", "16.99", "Skincare", "SKINCARE"),
                    new ProductSeed("Sheet Mask Set (5 pack)", "Hydrating variety pack", "12.99", "Skincare", "SKINCARE"),
                    new ProductSeed("Shampoo & Conditioner Set", "Sulfate-free, 2x10oz", "17.99", "Personal Care", "SKINCARE")
            )),
            new StoreSeed("Nail & Spa Essentials", Vertical.BEAUTY, "COSMETICS", 4.5, 20, 0.032, -0.010, List.of(
                    new ProductSeed("Nail Polish Set (6 pack)", "Long-lasting, vibrant colors", "14.99", "Makeup", "COSMETICS"),
                    new ProductSeed("Nail File & Buffer Kit", "Salon-quality tools", "7.99", "Makeup", "COSMETICS"),
                    new ProductSeed("Cuticle Oil", "Nourishing almond oil blend", "6.99", "Skincare", "SKINCARE"),
                    new ProductSeed("Hand Cream", "Intensive moisture, 3.5oz", "8.99", "Skincare", "SKINCARE"),
                    new ProductSeed("Bath Bomb Set (6 pack)", "Relaxing scented bath bombs", "16.99", "Personal Care", "COSMETICS"),
                    new ProductSeed("Hydrating Face Mask", "Clay mask, deep cleanse", "9.99", "Skincare", "SKINCARE")
            )),
            new StoreSeed("Men's Grooming Co", Vertical.BEAUTY, "SKINCARE", 4.4, 19, -0.020, 0.027, List.of(
                    new ProductSeed("Beard Oil", "Nourishing, lightweight formula", "13.99", "Personal Care", "SKINCARE"),
                    new ProductSeed("Shaving Cream", "Smooth glide, sensitive skin", "8.99", "Personal Care", "SKINCARE"),
                    new ProductSeed("Aftershave Balm", "Soothing, alcohol-free", "10.99", "Personal Care", "SKINCARE"),
                    new ProductSeed("Hair Pomade", "Matte finish, strong hold", "11.99", "Makeup", "COSMETICS"),
                    new ProductSeed("Body Wash", "Fresh scent, 16oz", "7.99", "Personal Care", "SKINCARE"),
                    new ProductSeed("Deodorant Stick", "24-hour protection", "5.99", "Personal Care", "SKINCARE")
            )),

            new StoreSeed("Glamour Studio", Vertical.BEAUTY, "COSMETICS", 4.5, 23, 0.014, 0.030, List.of(
                    new ProductSeed("Liquid Foundation", "Buildable medium coverage", "16.99", "Makeup", "COSMETICS"),
                    new ProductSeed("Eyeshadow Palette", "12 blendable shades", "19.99", "Makeup", "COSMETICS"),
                    new ProductSeed("Setting Spray", "All-day matte finish", "13.99", "Makeup", "COSMETICS"),
                    new ProductSeed("Eyelash Curler", "Precision stainless steel", "6.99", "Makeup", "COSMETICS")
            )),
            new StoreSeed("Radiant Skin Co", Vertical.BEAUTY, "SKINCARE", 4.6, 24, -0.029, -0.021, List.of(
                    new ProductSeed("Retinol Night Cream", "Anti-aging, 1oz", "22.99", "Skincare", "SKINCARE"),
                    new ProductSeed("Hyaluronic Acid Serum", "Deep hydration, 1oz", "18.99", "Skincare", "SKINCARE"),
                    new ProductSeed("Exfoliating Scrub", "Gentle, for all skin types", "11.99", "Skincare", "SKINCARE"),
                    new ProductSeed("Under-Eye Patches (12 pairs)", "Cooling, de-puffing", "13.99", "Skincare", "SKINCARE")
            )),

            // ---------- PETS ----------
            new StoreSeed("Pet Paradise", Vertical.PETS, "PETS", 4.5, 27, -0.018, 0.005, List.of(
                    new ProductSeed("Dry Dog Food (5 lb)", "Chicken & rice recipe", "18.99", "Food", "PETS"),
                    new ProductSeed("Squeaky Dog Toy", "Durable rubber chew toy", "7.99", "Toys & Accessories", "PETS"),
                    new ProductSeed("Cat Litter (10 lb)", "Clumping, odor control", "14.99", "Habitat & Supplies", "PETS"),
                    new ProductSeed("Pet Shampoo", "Gentle oatmeal formula, 16oz", "9.99", "Toys & Accessories", "PETS")
            )),
            new StoreSeed("Happy Paws", Vertical.PETS, "PETS", 4.4, 24, 0.012, 0.024, List.of(
                    new ProductSeed("Wet Cat Food (12 pack)", "Salmon pate cans", "16.99", "Food", "PETS"),
                    new ProductSeed("Pet Treats (Variety Pack)", "Grain-free training treats", "8.99", "Food", "PETS"),
                    new ProductSeed("Adjustable Pet Leash", "Reflective, 6ft nylon", "11.99", "Toys & Accessories", "PETS"),
                    new ProductSeed("Cat Scratching Post", "Sisal rope, stable base", "24.99", "Habitat & Supplies", "PETS")
            )),
            new StoreSeed("Aquarium World", Vertical.PETS, "PETS", 4.3, 25, -0.034, -0.020, List.of(
                    new ProductSeed("Fish Food Flakes", "Complete nutrition, 3oz", "6.99", "Food", "PETS"),
                    new ProductSeed("Aquarium Filter", "Quiet, adjustable flow", "24.99", "Habitat & Supplies", "PETS"),
                    new ProductSeed("Fish Tank Decor Set", "Plants & hideaway cave", "13.99", "Habitat & Supplies", "PETS"),
                    new ProductSeed("Water Conditioner", "Removes chlorine, 16oz", "8.99", "Habitat & Supplies", "PETS"),
                    new ProductSeed("LED Aquarium Light", "Color-changing, timer built-in", "19.99", "Habitat & Supplies", "PETS"),
                    new ProductSeed("Betta Fish Tank (3 gal)", "Complete starter kit", "34.99", "Habitat & Supplies", "PETS")
            )),
            new StoreSeed("Bird & Small Pet Shop", Vertical.PETS, "PETS", 4.6, 23, 0.033, 0.026, List.of(
                    new ProductSeed("Bird Seed Mix", "Premium blend, 4 lb", "9.99", "Food", "PETS"),
                    new ProductSeed("Rabbit Food Pellets", "Timothy hay based, 5 lb", "11.99", "Food", "PETS"),
                    new ProductSeed("Hamster Bedding", "Soft, absorbent, 10L", "8.99", "Habitat & Supplies", "PETS"),
                    new ProductSeed("Small Pet Cage", "Wire cage with accessories", "44.99", "Habitat & Supplies", "PETS"),
                    new ProductSeed("Bird Cage Swing", "Colorful wooden perch swing", "7.99", "Toys & Accessories", "PETS"),
                    new ProductSeed("Chew Toys (3 pack)", "Safe for small animals", "6.99", "Toys & Accessories", "PETS")
            )),
            new StoreSeed("Furry Friends Market", Vertical.PETS, "PETS", 4.4, 26, 0.017, -0.028, List.of(
                    new ProductSeed("Grain-Free Dog Food (10 lb)", "Salmon & sweet potato", "29.99", "Food", "PETS"),
                    new ProductSeed("Dog Dental Chews", "Reduces plaque & tartar", "9.99", "Food", "PETS"),
                    new ProductSeed("Orthopedic Pet Bed", "Memory foam, machine washable", "39.99", "Habitat & Supplies", "PETS"),
                    new ProductSeed("Retractable Dog Leash", "16ft, one-button lock", "16.99", "Toys & Accessories", "PETS")
            )),
            new StoreSeed("The Pet Pantry", Vertical.PETS, "PETS", 4.3, 22, -0.031, 0.020, List.of(
                    new ProductSeed("Kitten Starter Kit", "Food, toy & grooming brush", "24.99", "Food", "PETS"),
                    new ProductSeed("Freeze-Dried Cat Treats", "Single-ingredient, grain-free", "8.99", "Food", "PETS"),
                    new ProductSeed("Cat Carrier", "Ventilated, airline approved", "34.99", "Habitat & Supplies", "PETS"),
                    new ProductSeed("Interactive Feather Wand", "Encourages active play", "6.99", "Toys & Accessories", "PETS")
            ))
    );
}
